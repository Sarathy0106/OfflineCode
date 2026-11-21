package com.offlinecode.core

sealed interface RunEvent {
    data class Stdout(val text: String) : RunEvent
    data class Stderr(val text: String) : RunEvent
    data class CompileError(val line: Int, val col: Int, val msg: String) : RunEvent
    data class Exit(val code: Int, val millis: Long) : RunEvent
}
