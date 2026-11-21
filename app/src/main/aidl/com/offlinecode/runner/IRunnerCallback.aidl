package com.offlinecode.runner;

interface IRunnerCallback {
    void onStdout(String text);
    void onStderr(String text);
    void onCompileError(int line, int column, String message);
    void onExit(int exitCode, long executionTimeMs);
}
