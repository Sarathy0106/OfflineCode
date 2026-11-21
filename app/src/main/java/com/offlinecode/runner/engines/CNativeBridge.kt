package com.offlinecode.runner.engines

object CNativeBridge {
    init {
        System.loadLibrary("offlinecode")
    }

    external fun initTcc(includeDir: String)
    external fun runCCode(sourceCode: String, callback: NativeRunCallback): Int
    external fun writeStdin(input: String)
}
