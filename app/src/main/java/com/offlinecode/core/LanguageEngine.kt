package com.offlinecode.core

import kotlinx.coroutines.flow.Flow

interface LanguageEngine {
    val id: String
    val name: String
    val isInstalled: Boolean
    suspend fun run(source: String, stdin: Flow<String>, limits: Limits): Flow<RunEvent>
}
