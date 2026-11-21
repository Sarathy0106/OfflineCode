package com.offlinecode.runner.engines

import android.content.Context
import com.offlinecode.runner.IRunnerCallback
import java.io.File
import java.io.FileOutputStream

class CEngine(private val context: Context) {

    private val includeDir: File by lazy {
        val dir = File(context.filesDir, "tcc_include")
        if (!dir.exists() || dir.listFiles().isNullOrEmpty()) {
            dir.mkdirs()
            extractAssetFolder("tcc/include", dir)
        }
        dir
    }

    init {
        CNativeBridge.initTcc(includeDir.absolutePath)
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

        return CNativeBridge.runCCode(sourceCode, nativeCallback)
    }

    fun writeStdin(input: String) {
        CNativeBridge.writeStdin(input)
    }

    private fun extractAssetFolder(assetPath: String, destDir: File) {
        val assets = context.assets.list(assetPath) ?: return
        for (item in assets) {
            val subAssetPath = "$assetPath/$item"
            val subItems = context.assets.list(subAssetPath)
            if (!subItems.isNullOrEmpty()) {
                val subDir = File(destDir, item)
                subDir.mkdirs()
                extractAssetFolder(subAssetPath, subDir)
            } else {
                val outFile = File(destDir, item)
                try {
                    context.assets.open(subAssetPath).use { input ->
                        FileOutputStream(outFile).use { output ->
                            input.copyTo(output)
                        }
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }
}
