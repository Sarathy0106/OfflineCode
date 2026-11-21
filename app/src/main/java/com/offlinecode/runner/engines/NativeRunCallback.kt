package com.offlinecode.runner.engines

interface NativeRunCallback {
    fun onStdout(text: String)
    fun onStderr(text: String)
    fun onCompileError(line: Int, col: Int, msg: String)
}
