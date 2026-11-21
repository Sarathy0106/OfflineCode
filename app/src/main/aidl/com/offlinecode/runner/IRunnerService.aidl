package com.offlinecode.runner;

import com.offlinecode.runner.IRunnerCallback;

interface IRunnerService {
    void run(String language, String sourceCode, int timeoutSeconds, int memoryLimitMb, IRunnerCallback callback);
    void sendStdin(String input);
    void stop();
}
