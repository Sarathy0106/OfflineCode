package com.offlinecode.runner.engines

object PythonNativeBridge {
    init {
        System.loadLibrary("offlinecode")
    }

    external fun initPython(pythonHome: String)
    external fun runPythonCode(sourceCode: String, callback: NativeRunCallback): Int
    external fun writeStdin(input: String)
}
