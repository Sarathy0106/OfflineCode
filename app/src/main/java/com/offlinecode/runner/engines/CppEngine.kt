package com.offlinecode.runner.engines

import android.content.Context
import android.system.Os
import android.util.Log
import com.offlinecode.runner.IRunnerCallback
import java.io.BufferedReader
import java.io.File
import java.io.FileOutputStream
import java.io.InputStreamReader
import java.util.regex.Pattern
import java.util.zip.ZipInputStream

class CppEngine(private val context: Context) {

    companion object {
        private const val TAG = "CppEngine"
        private val ERROR_PATTERN = Pattern.compile(".*:(\\d+):(?:(\\d+):)?\\s*(error:\\s*.*)")
    }

    private val cppDir = File(context.filesDir, "cpp")
    private val workspaceDir = File(cppDir, "workspace")
    private val binDir = File(cppDir, "bin")
    private val libDir = File(cppDir, "lib")
    private val includeDir = File(cppDir, "include")
    private val clangResourceDir = File(cppDir, "clang_resource")

    init {
        ensureToolchainReady()
    }

    private fun ensureToolchainReady() {
        if (!cppDir.exists()) cppDir.mkdirs()
        if (!workspaceDir.exists()) workspaceDir.mkdirs()
        if (!binDir.exists()) binDir.mkdirs()

        // 1. Extract include headers if not present
        val iostreamMarker = File(includeDir, "c++/v1/iostream")
        if (!iostreamMarker.exists()) {
            Log.d(TAG, "Extracting C++ include headers...")
            extractZipAsset("cpp/include.zip", cppDir)
        }

        // 2. Extract clang resource if not present
        val stddefMarker = File(clangResourceDir, "include/stddef.h")
        if (!stddefMarker.exists()) {
            Log.d(TAG, "Extracting Clang resources...")
            extractZipAsset("cpp/clang_resource.zip", cppDir)
        }

        // 3. Extract sysroot libs if not present
        val libMarker = File(libDir, "libz.so.1")
        if (!libMarker.exists()) {
            Log.d(TAG, "Extracting C++ sysroot libs...")
            extractZipAsset("cpp/lib.zip", cppDir)
        }

        // 4. Create symlinks for clang and ld.lld in binDir pointing to nativeLibraryDir
        val nativeLibDir = context.applicationInfo.nativeLibraryDir
        val lldNative = File(nativeLibDir, "liblld_exec.so")
        val clangNative = File(nativeLibDir, "libclang_exec.so")

        createSymlinkSafely(clangNative.absolutePath, File(binDir, "clang").absolutePath)
        createSymlinkSafely(lldNative.absolutePath, File(binDir, "ld.lld").absolutePath)
        createSymlinkSafely(lldNative.absolutePath, File(binDir, "lld").absolutePath)
    }

    private fun createSymlinkSafely(target: String, linkName: String) {
        try {
            try {
                Os.remove(linkName)
            } catch (ignored: Exception) {}
            Os.symlink(target, linkName)
            Log.d(TAG, "Created symlink: $linkName -> $target")
        } catch (e: Exception) {
            Log.w(TAG, "Failed to create symlink $linkName -> $target: ${e.message}")
        }
    }

    private fun extractZipAsset(assetPath: String, targetDir: File) {
        try {
            context.assets.open(assetPath).use { input ->
                ZipInputStream(input).use { zip ->
                    var entry = zip.nextEntry
                    while (entry != null) {
                        val outFile = File(targetDir, entry.name)
                        if (entry.isDirectory) {
                            outFile.mkdirs()
                        } else {
                            outFile.parentFile?.mkdirs()
                            FileOutputStream(outFile).use { fos ->
                                zip.copyTo(fos)
                            }
                        }
                        zip.closeEntry()
                        entry = zip.nextEntry
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error extracting asset $assetPath", e)
        }
    }

    fun run(
        sourceCode: String,
        callback: IRunnerCallback,
        optLevel: String = "-O0",
        warnings: Boolean = false,
        onExecutionStart: (() -> Unit)? = null
    ): Int {
        val nativeLibDir = context.applicationInfo.nativeLibraryDir
        val clangBin = File(nativeLibDir, "libclang_exec.so")

        if (!clangBin.exists()) {
            callback.onStderr("C++ Compiler binary not found at ${clangBin.absolutePath}\n")
            return 1
        }

        // 1. Write source file
        val timestamp = System.currentTimeMillis()
        val srcFile = File(workspaceDir, "code_$timestamp.cpp")
        val outFile = File(workspaceDir, "libuser_$timestamp.so")
        val lldNative = File(nativeLibDir, "liblld_exec.so")

        try {
            srcFile.writeText(sourceCode)

            callback.onStdout("[Compiling C++...]\n")

            // 2. Compile via Clang process
            val cmd = mutableListOf(
                clangBin.absolutePath,
                "-shared",
                "-fPIC",
                "-std=c++17",
                optLevel
            )
            if (warnings) {
                cmd.add("-Wall")
            }
            if (lldNative.exists()) {
                cmd.add("-fuse-ld=lld")
                cmd.add("--ld-path=${lldNative.absolutePath}")
            }
            cmd.addAll(listOf(
                "-resource-dir", clangResourceDir.absolutePath,
                "-I${includeDir.absolutePath}/c++/v1",
                "-I${includeDir.absolutePath}",
                "-I${includeDir.absolutePath}/aarch64-linux-android",
                "-B${binDir.absolutePath}",
                "-B${libDir.absolutePath}",
                "-L${libDir.absolutePath}",
                "-L$nativeLibDir",
                "-L/system/lib64",
                "-lc++_shared",
                srcFile.absolutePath,
                "-o", outFile.absolutePath
            ))

            val pb = ProcessBuilder(cmd)
            pb.directory(workspaceDir)
            pb.redirectErrorStream(true) // Merge stdout and stderr to prevent pipe buffer deadlocks
            val env = pb.environment()
            env["PATH"] = "${binDir.absolutePath}:/system/bin"
            env["LD_LIBRARY_PATH"] = "$nativeLibDir:${libDir.absolutePath}:/system/lib64"

            val process = pb.start()

            val outputLines = mutableListOf<String>()
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            var line: String? = reader.readLine()
            while (line != null) {
                outputLines.add(line)
                val matcher = ERROR_PATTERN.matcher(line)
                if (matcher.find()) {
                    val lineNum = matcher.group(1)?.toIntOrNull() ?: 0
                    val colNum = matcher.group(2)?.toIntOrNull() ?: 0
                    val msg = matcher.group(3) ?: line
                    try {
                        callback.onCompileError(lineNum, colNum, msg)
                    } catch (ignored: Exception) {}
                }
                line = reader.readLine()
            }

            val compileExit = process.waitFor()
            if (compileExit != 0 || !outFile.exists()) {
                for (l in outputLines) {
                    callback.onStderr("$l\n")
                }
                return compileExit
            }

            callback.onStdout("[Running...]\n")

            // 3. Execute via JNI dlopen
            onExecutionStart?.invoke()
            val nativeCallback = object : NativeRunCallback {
                override fun onStdout(text: String) {
                    try {
                        callback.onStdout(text)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                override fun onStderr(text: String) {
                    try {
                        callback.onStderr(text)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                override fun onCompileError(line: Int, col: Int, msg: String) {
                    try {
                        callback.onCompileError(line, col, msg)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }

            val runExit = CppNativeBridge.runSharedLibrary(outFile.absolutePath, nativeCallback)
            return runExit

        } catch (e: Exception) {
            callback.onStderr("Execution failed: ${e.message}\n")
            return 1
        } finally {
            srcFile.delete()
            outFile.delete()
        }
    }

    fun writeStdin(input: String) {
        CppNativeBridge.writeStdin(input)
    }
}
