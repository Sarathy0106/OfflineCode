package com.offlinecode.runner.engines

object CppNativeBridge {
    init {
        System.loadLibrary("offlinecode")
    }

    external fun runSharedLibrary(libraryPath: String, callback: NativeRunCallback): Int
    external fun writeStdin(input: String)
}
