#pragma once

#include <string>
#include <functional>
#include <thread>
#include <atomic>
#include <unistd.h>
#include <fcntl.h>

class PipeManager {
public:
    PipeManager();
    ~PipeManager();

    bool start(std::function<void(const std::string&)> stdoutCallback,
               std::function<void(const std::string&)> stderrCallback);
    void writeStdin(const std::string& input);
    void stop();

private:
    int m_stdout_pipe[2];
    int m_stderr_pipe[2];
    int m_stdin_pipe[2];

    int m_saved_stdout;
    int m_saved_stderr;
    int m_saved_stdin;

    std::atomic<bool> m_running{false};
    std::thread m_stdout_thread;
    std::thread m_stderr_thread;

    std::function<void(const std::string&)> m_stdoutCallback;
    std::function<void(const std::string&)> m_stderrCallback;

    void readLoop(int fd, const std::function<void(const std::string&)>& callback);
};
