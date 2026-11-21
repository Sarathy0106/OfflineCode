package com.offlinecode.core

data class Limits(
    val timeoutSeconds: Int = 30,
    val memoryLimitMb: Int = 256
)
