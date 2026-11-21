package com.offlinecode.runner.engines

import android.content.Context
import com.offlinecode.runner.IRunnerCallback
import dalvik.system.DexClassLoader
import java.io.*
import java.lang.reflect.Method
import java.util.regex.Pattern

class JavaEngine(private val context: Context) {

    private val javaDir: File by lazy {
        val dir = File(context.filesDir, "java_tools")
        if (!dir.exists()) dir.mkdirs()
        ensureAssetExtracted("java/ecj.jar", File(dir, "ecj.jar"))
        ensureAssetExtracted("java/d8.dex", File(dir, "d8.dex"))
        ensureAssetExtracted("java/rt.jar", File(dir, "rt.jar"))
        dir
    }

    private val ecjJar get() = File(javaDir, "ecj.jar")
    private val d8Dex get() = File(javaDir, "d8.dex")
    private val rtJar get() = File(javaDir, "rt.jar")

    private val stdinPipedOutput = PipedOutputStream()
    private val stdinPipedInput = PipedInputStream(stdinPipedOutput)

    fun run(sourceCode: String, callback: IRunnerCallback): Int {
        val workDir = File(context.cacheDir, "java_run_${System.currentTimeMillis()}")
        workDir.mkdirs()

        try {
            // Determine class name from source code
            val className = extractClassName(sourceCode) ?: "Main"
            val javaFile = File(workDir, "$className.java")
            javaFile.writeText(sourceCode)

            val classesDir = File(workDir, "bin")
            classesDir.mkdirs()

            // Step 1: Compile with ECJ
            val ecjOutWriter = StringWriter()
            val ecjErrWriter = StringWriter()
            val ecjPrintWriterOut = PrintWriter(ecjOutWriter)
            val ecjPrintWriterErr = PrintWriter(ecjErrWriter)

            val ecjLoader = DexClassLoader(
                ecjJar.absolutePath,
                context.codeCacheDir.absolutePath,
                null,
                javaClass.classLoader
            )
            val ecjMainClass = ecjLoader.loadClass("org.eclipse.jdt.internal.compiler.batch.Main")
            val ecjConstructor = ecjMainClass.getConstructor(
                PrintWriter::class.java,
                PrintWriter::class.java,
                Boolean::class.javaPrimitiveType
            )
            val ecjInstance = ecjConstructor.newInstance(ecjPrintWriterOut, ecjPrintWriterErr, false)
            val compileMethod = ecjMainClass.getMethod("compile", Array<String>::class.java)

            val ecjArgs = arrayOf(
                "-proc:none",
                "-7",
                "-classpath", rtJar.absolutePath,
                javaFile.absolutePath,
                "-d", classesDir.absolutePath
            )

            val ecjSuccess = compileMethod.invoke(ecjInstance, ecjArgs) as? Boolean ?: false

            val compileErr = ecjErrWriter.toString()
            if (!ecjSuccess || compileErr.contains("ERROR in")) {
                parseAndReportCompileErrors(compileErr, callback)
                return 1
            }

            // Step 2: Dex with D8
            val outJar = File(workDir, "out.jar")
            val classFiles = classesDir.listFiles { file -> file.extension == "class" } ?: emptyArray()
            if (classFiles.isEmpty()) {
                callback.onStderr("Error: No class files generated.\n")
                return 2
            }

            val d8Args = mutableListOf<String>()
            for (cf in classFiles) {
                d8Args.add(cf.absolutePath)
            }
            d8Args.add("--output")
            d8Args.add(outJar.absolutePath)
            d8Args.add("--min-api")
            d8Args.add("24")

            val d8Loader = DexClassLoader(
                d8Dex.absolutePath,
                context.codeCacheDir.absolutePath,
                null,
                javaClass.classLoader
            )
            val d8Class = d8Loader.loadClass("com.android.tools.r8.D8")
            val d8Main = d8Class.getMethod("main", Array<String>::class.java)
            d8Main.invoke(null, d8Args.toTypedArray())

            if (!outJar.exists()) {
                callback.onStderr("Error: D8 failed to generate dex file.\n")
                return 3
            }

            // Mark read-only for Android 14+ DexClassLoader security
            outJar.setReadOnly()

            // Step 3: Run class
            val userClassLoader = DexClassLoader(
                outJar.absolutePath,
                context.codeCacheDir.absolutePath,
                null,
                ClassLoader.getSystemClassLoader()
            )
            val userClass = userClassLoader.loadClass(className)
            val mainMethod: Method = userClass.getMethod("main", Array<String>::class.java)

            val origOut = System.out
            val origErr = System.err
            val origIn = System.`in`

            val customOut = PrintStream(object : OutputStream() {
                override fun write(b: Int) {
                    callback.onStdout(b.toChar().toString())
                }

                override fun write(b: ByteArray, off: Int, len: Int) {
                    callback.onStdout(String(b, off, len))
                }
            }, true)

            val customErr = PrintStream(object : OutputStream() {
                override fun write(b: Int) {
                    callback.onStderr(b.toChar().toString())
                }

                override fun write(b: ByteArray, off: Int, len: Int) {
                    callback.onStderr(String(b, off, len))
                }
            }, true)

            System.setOut(customOut)
            System.setErr(customErr)
            System.setIn(stdinPipedInput)

            try {
                mainMethod.invoke(null, arrayOf<String>())
            } catch (t: Throwable) {
                val cause = t.cause ?: t
                callback.onStderr("Runtime Exception: ${cause.message}\n")
                val sw = StringWriter()
                cause.printStackTrace(PrintWriter(sw))
                callback.onStderr(sw.toString())
                return 4
            } finally {
                System.setOut(origOut)
                System.setErr(origErr)
                System.setIn(origIn)
            }

            return 0
        } catch (e: Exception) {
            e.printStackTrace()
            callback.onStderr("Error: ${e.message}\n")
            return 5
        } finally {
            workDir.deleteRecursively()
        }
    }

    fun writeStdin(input: String) {
        try {
            stdinPipedOutput.write(input.toByteArray())
            stdinPipedOutput.flush()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun extractClassName(source: String): String? {
        val pattern = Pattern.compile("public\\s+class\\s+(\\w+)")
        val matcher = pattern.matcher(source)
        return if (matcher.find()) matcher.group(1) else null
    }

    private fun parseAndReportCompileErrors(errorOutput: String, callback: IRunnerCallback) {
        // Pattern: [line] ERROR in ... (at line [line])
        val lines = errorOutput.lines()
        var currentLine = 1
        for (l in lines) {
            if (l.contains("at line ")) {
                val match = Regex("at line (\\d+)").find(l)
                if (match != null) {
                    currentLine = match.groupValues[1].toIntOrNull() ?: 1
                }
            }
            if (l.contains("ERROR in") || l.contains("cannot be resolved") || l.contains("Syntax error") || l.contains("problems (")) {
                callback.onCompileError(currentLine, 0, l.trim())
            } else if (l.isNotBlank()) {
                callback.onStderr("$l\n")
            }
        }
    }

    private fun ensureAssetExtracted(assetName: String, destFile: File) {
        if (!destFile.exists() || destFile.length() == 0L) {
            destFile.parentFile?.mkdirs()
            context.assets.open(assetName).use { input ->
                FileOutputStream(destFile).use { output ->
                    input.copyTo(output)
                }
            }
            destFile.setReadOnly()
        }
    }
}
