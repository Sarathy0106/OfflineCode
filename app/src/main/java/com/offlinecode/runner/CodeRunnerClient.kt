package com.offlinecode.runner

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import com.offlinecode.core.Limits
import com.offlinecode.core.RunEvent
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicReference

class CodeRunnerClient(private val context: Context) {

    private val serviceRef = AtomicReference<IRunnerService?>()
    private var isBound = false

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            serviceRef.set(IRunnerService.Stub.asInterface(service))
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            serviceRef.set(null)
            bindService()
        }

        override fun onBindingDied(name: ComponentName?) {
            serviceRef.set(null)
            bindService()
        }
    }

    init {
        bindService()
    }

    private fun bindService() {
        val intent = Intent(context, CodeRunnerService::class.java)
        context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
        isBound = true
    }

    fun sendStdin(input: String) {
        try {
            serviceRef.get()?.sendStdin(input)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun stop() {
        try {
            serviceRef.get()?.stop()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun execute(language: String, source: String, stdin: Flow<String>, limits: Limits): Flow<RunEvent> = callbackFlow {
        var attempts = 0
        while (serviceRef.get() == null && attempts < 20) {
            delay(100)
            attempts++
        }

        val service = serviceRef.get()
        if (service == null) {
            trySend(RunEvent.Stderr("Error: Runner service unavailable.\n"))
            trySend(RunEvent.Exit(-1, 0))
            close()
            return@callbackFlow
        }

        val stdinJob = launch {
            stdin.collect { input ->
                try {
                    service.sendStdin(input)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }

        val callback = object : IRunnerCallback.Stub() {
            override fun onStdout(text: String?) {
                if (text != null) trySend(RunEvent.Stdout(text))
            }

            override fun onStderr(text: String?) {
                if (text != null) trySend(RunEvent.Stderr(text))
            }

            override fun onCompileError(line: Int, column: Int, message: String?) {
                if (message != null) trySend(RunEvent.CompileError(line, column, message))
            }

            override fun onExit(exitCode: Int, executionTimeMs: Long) {
                trySend(RunEvent.Exit(exitCode, executionTimeMs))
                close()
            }
        }

        try {
            service.run(language, source, limits.timeoutSeconds, limits.memoryLimitMb, callback)
        } catch (e: Exception) {
            trySend(RunEvent.Stderr("Runner connection error: ${e.message}\n"))
            trySend(RunEvent.Exit(-1, 0))
            close()
        }

        awaitClose {
            stdinJob.cancel()
        }
    }
}
