package com.offlinecode.runner

import android.app.Service
import android.content.Intent
import android.os.Debug
import android.os.IBinder
import android.os.Process
import com.offlinecode.runner.engines.CEngine
import com.offlinecode.runner.engines.JavaEngine
import com.offlinecode.runner.engines.PythonEngine
import kotlinx.coroutines.*
import java.util.concurrent.Executors

class CodeRunnerService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private val runExecutor = Executors.newSingleThreadExecutor()

    private var cEngine: CEngine? = null
    private var pythonEngine: PythonEngine? = null
    private var javaEngine: JavaEngine? = null

    private var activeLanguage: String? = null
    private var watchdogJob: Job? = null
    private var activeRunJob: Job? = null

    override fun onCreate() {
        super.onCreate()
    }

    private val binder = object : IRunnerService.Stub() {
        override fun run(
            language: String,
            sourceCode: String,
            timeoutSeconds: Int,
            memoryLimitMb: Int,
            callback: IRunnerCallback
        ) {
            activeLanguage = language
            val startTime = System.currentTimeMillis()

            // Setup Watchdog: Timeout and Memory Limits
            watchdogJob?.cancel()
            watchdogJob = serviceScope.launch {
                val effectiveTimeout = if (timeoutSeconds > 0) timeoutSeconds else 10
                val effectiveMemoryLimit = if (memoryLimitMb > 0) memoryLimitMb else 256

                val checkIntervalMs = 250L
                var elapsedMs = 0L

                while (isActive) {
                    delay(checkIntervalMs)
                    elapsedMs += checkIntervalMs

                    // Check Timeout
                    if (elapsedMs >= effectiveTimeout * 1000L) {
                        try {
                            callback.onStderr("\n[Process killed: Execution timed out after ${effectiveTimeout}s]\n")
                            callback.onExit(-1, System.currentTimeMillis() - startTime)
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                        // Terminate process to cleanly unblock infinite loops
                        Process.killProcess(Process.myPid())
                        return@launch
                    }

                    // Check Memory Usage
                    val runtime = Runtime.getRuntime()
                    val usedMemMb = (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024)
                    val pssMemMb = Debug.getPss() / 1024

                    if (usedMemMb > effectiveMemoryLimit || pssMemMb > effectiveMemoryLimit) {
                        try {
                            callback.onStderr("\n[Process killed: Memory limit exceeded (${effectiveMemoryLimit}MB)]\n")
                            callback.onExit(-2, System.currentTimeMillis() - startTime)
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                        Process.killProcess(Process.myPid())
                        return@launch
                    }
                }
            }

            activeRunJob?.cancel()
            activeRunJob = serviceScope.launch {
                runExecutor.execute {
                    var exitCode = 0
                    try {
                        when (language.lowercase()) {
                            "c" -> {
                                if (cEngine == null) cEngine = CEngine(applicationContext)
                                exitCode = cEngine!!.run(sourceCode, callback)
                            }
                            "python" -> {
                                if (pythonEngine == null) pythonEngine = PythonEngine(applicationContext)
                                exitCode = pythonEngine!!.run(sourceCode, callback)
                            }
                            "java" -> {
                                if (javaEngine == null) javaEngine = JavaEngine(applicationContext)
                                exitCode = javaEngine!!.run(sourceCode, callback)
                            }
                            "cpp" -> {
                                callback.onStderr("C++ requires the Clang pack from Settings.\n")
                                exitCode = 1
                            }
                            else -> {
                                callback.onStderr("Unsupported language: $language\n")
                                exitCode = -1
                            }
                        }
                    } catch (e: Exception) {
                        try {
                            callback.onStderr("Execution error: ${e.message}\n")
                        } catch (ignored: Exception) {}
                        exitCode = 1
                    } finally {
                        watchdogJob?.cancel()
                        val duration = System.currentTimeMillis() - startTime
                        try {
                            callback.onExit(exitCode, duration)
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                }
            }
        }

        override fun sendStdin(input: String) {
            when (activeLanguage?.lowercase()) {
                "c" -> cEngine?.writeStdin(input)
                "python" -> pythonEngine?.writeStdin(input)
                "java" -> javaEngine?.writeStdin(input)
            }
        }

        override fun stop() {
            watchdogJob?.cancel()
            activeRunJob?.cancel()
            // To guarantee instant stop of native infinite loops
            Process.killProcess(Process.myPid())
        }
    }

    override fun onBind(intent: Intent?): IBinder {
        return binder
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        runExecutor.shutdownNow()
    }
}
