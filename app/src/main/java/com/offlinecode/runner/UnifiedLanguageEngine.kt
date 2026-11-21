package com.offlinecode.runner

import com.offlinecode.core.LanguageEngine
import com.offlinecode.core.Limits
import com.offlinecode.core.RunEvent
import kotlinx.coroutines.flow.Flow

class UnifiedLanguageEngine(
    override val id: String,
    override val name: String,
    override val isInstalled: Boolean,
    private val client: CodeRunnerClient
) : LanguageEngine {
    override suspend fun run(source: String, stdin: Flow<String>, limits: Limits): Flow<RunEvent> {
        return client.execute(id, source, stdin, limits)
    }
}
