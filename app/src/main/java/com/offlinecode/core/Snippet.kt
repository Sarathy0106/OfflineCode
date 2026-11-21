package com.offlinecode.core

data class Snippet(
    val id: String,
    val title: String,
    val language: String,
    val code: String,
    val updatedAt: Long = System.currentTimeMillis()
)
