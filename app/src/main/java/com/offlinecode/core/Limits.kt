package com.offlinecode.core

data class Limits(
    val timeoutSeconds: Int = 10,
    val memoryLimitMb: Int = 256
)
