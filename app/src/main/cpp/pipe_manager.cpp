#include "pipe_manager.h"
#include <cstdio>
#include <vector>

PipeManager::PipeManager()
    : m_saved_stdout(-1), m_saved_stderr(-1), m_saved_stdin(-1) {
    m_stdout_pipe[0] = m_stdout_pipe[1] = -1;
    m_stderr_pipe[0] = m_stderr_pipe[1] = -1;
    m_stdin_pipe[0] = m_stdin_pipe[1] = -1;
}

PipeManager::~PipeManager() {
    stop();
}

bool PipeManager::start(std::function<void(const std::string&)> stdoutCallback,
                        std::function<void(const std::string&)> stderrCallback) {
    if (m_running.load()) {
        return false;
    }

    m_stdoutCallback = stdoutCallback;
    m_stderrCallback = stderrCallback;

    // Save originals
    m_saved_stdout = dup(STDOUT_FILENO);
    m_saved_stderr = dup(STDERR_FILENO);
    m_saved_stdin = dup(STDIN_FILENO);

    if (pipe(m_stdout_pipe) < 0 || pipe(m_stderr_pipe) < 0 || pipe(m_stdin_pipe) < 0) {
        return false;
    }

    // Set stdout, stderr & stdin to unbuffered
    fflush(stdout);
    fflush(stderr);
    setvbuf(stdout, nullptr, _IONBF, 0);
    setvbuf(stderr, nullptr, _IONBF, 0);
    setvbuf(stdin, nullptr, _IONBF, 0);
    clearerr(stdin);

    // Redirect
    dup2(m_stdout_pipe[1], STDOUT_FILENO);
    dup2(m_stderr_pipe[1], STDERR_FILENO);
    dup2(m_stdin_pipe[0], STDIN_FILENO);

    // Ensure stdin error flags are cleared after redirection
    clearerr(stdin);
    setvbuf(stdin, nullptr, _IONBF, 0);

    m_running.store(true);

    // Flush any pending stdin that was sent while toolchain/runtime was starting up
    {
        std::lock_guard<std::mutex> lock(m_stdin_mutex);
        if (!m_pending_stdin.empty() && m_stdin_pipe[1] >= 0) {
            write(m_stdin_pipe[1], m_pending_stdin.c_str(), m_pending_stdin.length());
            m_pending_stdin.clear();
        }
    }

    m_stdout_thread = std::thread(&PipeManager::readLoop, this, m_stdout_pipe[0], m_stdoutCallback);
    m_stderr_thread = std::thread(&PipeManager::readLoop, this, m_stderr_pipe[0], m_stderrCallback);

    return true;
}

void PipeManager::writeStdin(const std::string& input) {
    std::lock_guard<std::mutex> lock(m_stdin_mutex);
    if (m_running.load() && m_stdin_pipe[1] >= 0) {
        write(m_stdin_pipe[1], input.c_str(), input.length());
    } else {
        // Buffer input so early typing is not discarded
        m_pending_stdin += input;
    }
}

void PipeManager::readLoop(int fd, const std::function<void(const std::string&)>& callback) {
    char buffer[1024];
    while (true) {
        ssize_t bytesRead = read(fd, buffer, sizeof(buffer) - 1);
        if (bytesRead > 0) {
            buffer[bytesRead] = '\0';
            if (callback) {
                callback(std::string(buffer, bytesRead));
            }
        } else {
            // EOF or error
            break;
        }
    }
}

void PipeManager::stop() {
    if (!m_running.exchange(false)) {
        return;
    }

    // Flush standard streams
    fflush(stdout);
    fflush(stderr);

    // Restore original file descriptors
    if (m_saved_stdout >= 0) {
        dup2(m_saved_stdout, STDOUT_FILENO);
        close(m_saved_stdout);
        m_saved_stdout = -1;
    }
    if (m_saved_stderr >= 0) {
        dup2(m_saved_stderr, STDERR_FILENO);
        close(m_saved_stderr);
        m_saved_stderr = -1;
    }
    if (m_saved_stdin >= 0) {
        dup2(m_saved_stdin, STDIN_FILENO);
        close(m_saved_stdin);
        m_saved_stdin = -1;
    }

    // Close pipe writer ends - this sends EOF to readLoop threads
    if (m_stdout_pipe[1] >= 0) { close(m_stdout_pipe[1]); m_stdout_pipe[1] = -1; }
    if (m_stderr_pipe[1] >= 0) { close(m_stderr_pipe[1]); m_stderr_pipe[1] = -1; }
    if (m_stdin_pipe[0] >= 0) { close(m_stdin_pipe[0]); m_stdin_pipe[0] = -1; }
    if (m_stdin_pipe[1] >= 0) { close(m_stdin_pipe[1]); m_stdin_pipe[1] = -1; }

    // Wait for reader threads to finish reading remaining output
    if (m_stdout_thread.joinable()) {
        m_stdout_thread.join();
    }
    if (m_stderr_thread.joinable()) {
        m_stderr_thread.join();
    }

    // Finally close reader ends
    if (m_stdout_pipe[0] >= 0) { close(m_stdout_pipe[0]); m_stdout_pipe[0] = -1; }
    if (m_stderr_pipe[0] >= 0) { close(m_stderr_pipe[0]); m_stderr_pipe[0] = -1; }
}
