package com.offlinecode.runner.engines

import android.content.Context
import android.os.Build
import com.offlinecode.runner.IRunnerCallback
import java.io.File
import java.io.FileOutputStream
import java.util.zip.ZipInputStream

class PythonEngine(private val context: Context) {

    private val pythonHome: File by lazy {
        val dir = File(context.filesDir, "python")
        val libDir = File(dir, "lib/python3.10")
        if (!libDir.exists() || libDir.listFiles().isNullOrEmpty()) {
            dir.mkdirs()
            extractPythonStdlib(dir)
        }
        dir
    }

    init {
        PythonNativeBridge.initPython(pythonHome.absolutePath)
    }

    fun run(sourceCode: String, callback: IRunnerCallback): Int {
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

        return PythonNativeBridge.runPythonCode(sourceCode, nativeCallback)
    }

    fun writeStdin(input: String) {
        PythonNativeBridge.writeStdin(input)
    }

    private fun extractPythonStdlib(destDir: File) {
        val is64Bit = Build.SUPPORTED_ABIS.isNotEmpty() && Build.SUPPORTED_ABIS[0].contains("64")
        val assetName = "python/pythonhome_arm64.zip"

        try {
            context.assets.open(assetName).use { assetStream ->
                ZipInputStream(assetStream).use { zipStream ->
                    var entry = zipStream.nextEntry
                    while (entry != null) {
                        val file = File(destDir, entry.name)
                        if (entry.isDirectory) {
                            file.mkdirs()
                        } else {
                            file.parentFile?.mkdirs()
                            FileOutputStream(file).use { out ->
                                zipStream.copyTo(out)
                            }
                        }
                        zipStream.closeEntry()
                        entry = zipStream.nextEntry
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
