#include <jni.h>
#include <string>
#include <vector>
#include <regex>
#include <dlfcn.h>
#include <cmath>
#include <cstdlib>
#include <cstring>
#include "pipe_manager.h"

extern "C" {
#include "tcc/libtcc.h"
}

static PipeManager g_c_pipe_manager;
static std::string g_include_dir;

struct CompileErrorInfo {
    int line = 0;
    int column = 0;
    std::string message;
};

static std::vector<CompileErrorInfo> g_compile_errors;

static void tcc_error_handler(void *opaque, const char *msg) {
    if (!msg) return;
    CompileErrorInfo info;
    info.message = msg;
    // TCC error format: "<string>:<line>: error: <msg>" or "<string>:<line>:<col>: error: <msg>"
    std::regex re(".*:(\\d+):(?:(\\d+):)?\\s*(.*)");
    std::cmatch m;
    if (std::regex_match(msg, m, re)) {
        try {
            info.line = std::stoi(m[1].str());
            if (m[2].matched) {
                info.column = std::stoi(m[2].str());
            }
            info.message = m[3].str();
        } catch (...) {
        }
    }
    g_compile_errors.push_back(info);
}

extern "C" JNIEXPORT void JNICALL
Java_com_offlinecode_runner_engines_CNativeBridge_initTcc(
        JNIEnv *env,
        jobject thiz,
        jstring includeDir) {
    const char *dir = env->GetStringUTFChars(includeDir, nullptr);
    g_include_dir = dir ? dir : "";
    if (dir) env->ReleaseStringUTFChars(includeDir, dir);
}

extern "C" JNIEXPORT void JNICALL
Java_com_offlinecode_runner_engines_CNativeBridge_writeStdin(
        JNIEnv *env,
        jobject thiz,
        jstring input) {
    const char *text = env->GetStringUTFChars(input, nullptr);
    if (text) {
        g_c_pipe_manager.writeStdin(text);
        env->ReleaseStringUTFChars(input, text);
    }
}

extern "C" JNIEXPORT jint JNICALL
Java_com_offlinecode_runner_engines_CNativeBridge_runCCode(
        JNIEnv *env,
        jobject thiz,
        jstring sourceCode,
        jobject callback) {

    jclass callbackClass = env->GetObjectClass(callback);
    jmethodID onStdoutMid = env->GetMethodID(callbackClass, "onStdout", "(Ljava/lang/String;)V");
    jmethodID onStderrMid = env->GetMethodID(callbackClass, "onStderr", "(Ljava/lang/String;)V");
    jmethodID onCompileErrorMid = env->GetMethodID(callbackClass, "onCompileError", "(IILjava/lang/String;)V");

    JavaVM *jvm = nullptr;
    env->GetJavaVM(&jvm);
    jobject globalCallback = env->NewGlobalRef(callback);

    g_compile_errors.clear();

    TCCState *s = tcc_new();
    if (!s) {
        jstring err = env->NewStringUTF("Failed to initialize C compiler engine.\n");
        env->CallVoidMethod(callback, onStderrMid, err);
        env->DeleteLocalRef(err);
        env->DeleteGlobalRef(globalCallback);
        return -1;
    }

    tcc_set_error_func(s, nullptr, tcc_error_handler);
    tcc_set_options(s, "-nostdlib");
    if (!g_include_dir.empty()) {
        tcc_add_include_path(s, g_include_dir.c_str());
    }
    tcc_set_output_type(s, TCC_OUTPUT_MEMORY);

    const char *code = env->GetStringUTFChars(sourceCode, nullptr);
    int compileRes = tcc_compile_string(s, code);
    env->ReleaseStringUTFChars(sourceCode, code);

    if (compileRes != 0 || !g_compile_errors.empty()) {
        for (const auto &err : g_compile_errors) {
            jstring msg = env->NewStringUTF(err.message.c_str());
            env->CallVoidMethod(callback, onCompileErrorMid, err.line, err.column, msg);
            env->DeleteLocalRef(msg);
        }
        tcc_delete(s);
        env->DeleteGlobalRef(globalCallback);
        return 1;
    }

    // Add common library symbols
    tcc_add_symbol(s, "printf", (const void *)printf);
    tcc_add_symbol(s, "puts", (const void *)puts);
    tcc_add_symbol(s, "putchar", (const void *)putchar);
    tcc_add_symbol(s, "scanf", (const void *)scanf);
    tcc_add_symbol(s, "getchar", (const void *)getchar);
    tcc_add_symbol(s, "malloc", (const void *)malloc);
    tcc_add_symbol(s, "free", (const void *)free);
    tcc_add_symbol(s, "realloc", (const void *)realloc);
    tcc_add_symbol(s, "calloc", (const void *)calloc);
    tcc_add_symbol(s, "sin", (const void *)(double(*)(double))sin);
    tcc_add_symbol(s, "cos", (const void *)(double(*)(double))cos);
    tcc_add_symbol(s, "tan", (const void *)(double(*)(double))tan);
    tcc_add_symbol(s, "sqrt", (const void *)(double(*)(double))sqrt);
    tcc_add_symbol(s, "pow", (const void *)(double(*)(double, double))pow);
    tcc_add_symbol(s, "strlen", (const void *)strlen);
    tcc_add_symbol(s, "strcmp", (const void *)strcmp);
    tcc_add_symbol(s, "strcpy", (const void *)strcpy);
    tcc_add_symbol(s, "exit", (const void *)exit);

    if (tcc_relocate(s, TCC_RELOCATE_AUTO) < 0) {
        jstring err = env->NewStringUTF("Relocation failed during C linking.\n");
        env->CallVoidMethod(callback, onStderrMid, err);
        env->DeleteLocalRef(err);
        tcc_delete(s);
        env->DeleteGlobalRef(globalCallback);
        return 2;
    }

    int (*main_fn)(int, char **) = (int (*)(int, char **))tcc_get_symbol(s, "main");
    if (!main_fn) {
        jstring err = env->NewStringUTF("Error: 'main' function not found in C program.\n");
        env->CallVoidMethod(callback, onStderrMid, err);
        env->DeleteLocalRef(err);
        tcc_delete(s);
        env->DeleteGlobalRef(globalCallback);
        return 3;
    }

    // Start pipe manager for stdout/stderr/stdin redirection
    g_c_pipe_manager.start(
        [jvm, globalCallback, onStdoutMid](const std::string &chunk) {
            JNIEnv *tEnv = nullptr;
            jvm->AttachCurrentThread(&tEnv, nullptr);
            if (tEnv) {
                jstring str = tEnv->NewStringUTF(chunk.c_str());
                tEnv->CallVoidMethod(globalCallback, onStdoutMid, str);
                tEnv->DeleteLocalRef(str);
            }
        },
        [jvm, globalCallback, onStderrMid](const std::string &chunk) {
            JNIEnv *tEnv = nullptr;
            jvm->AttachCurrentThread(&tEnv, nullptr);
            if (tEnv) {
                jstring str = tEnv->NewStringUTF(chunk.c_str());
                tEnv->CallVoidMethod(globalCallback, onStderrMid, str);
                tEnv->DeleteLocalRef(str);
            }
        }
    );

    int exitCode = main_fn(0, nullptr);

    g_c_pipe_manager.stop();
    tcc_delete(s);
    env->DeleteGlobalRef(globalCallback);

    return exitCode;
}
