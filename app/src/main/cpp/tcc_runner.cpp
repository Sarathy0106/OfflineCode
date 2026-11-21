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

static int safe_fflush(FILE *stream) {
    return fflush(nullptr);
}

static char g_fake_iob[3 * 64];
extern "C" FILE *__iob_func(void) {
    return (FILE *)g_fake_iob;
}

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
    tcc_add_symbol(s, "__iob_func", (const void *)__iob_func);
    tcc_add_symbol(s, "fflush", (const void *)safe_fflush);

#define ADD_LIBC_SYM(name) do { \
    void *sym = dlsym(RTLD_DEFAULT, #name); \
    if (sym) tcc_add_symbol(s, #name, sym); \
} while(0)

    ADD_LIBC_SYM(printf);
    ADD_LIBC_SYM(puts);
    ADD_LIBC_SYM(putchar);
    ADD_LIBC_SYM(scanf);
    ADD_LIBC_SYM(getchar);
    ADD_LIBC_SYM(sprintf);
    ADD_LIBC_SYM(snprintf);
    ADD_LIBC_SYM(sscanf);
    ADD_LIBC_SYM(fprintf);
    ADD_LIBC_SYM(fscanf);
    ADD_LIBC_SYM(fgets);
    ADD_LIBC_SYM(fputs);
    ADD_LIBC_SYM(fgetc);
    ADD_LIBC_SYM(fputc);
    ADD_LIBC_SYM(ungetc);
    ADD_LIBC_SYM(clearerr);
    ADD_LIBC_SYM(feof);
    ADD_LIBC_SYM(ferror);
    ADD_LIBC_SYM(perror);
    ADD_LIBC_SYM(malloc);
    ADD_LIBC_SYM(free);
    ADD_LIBC_SYM(realloc);
    ADD_LIBC_SYM(calloc);
    ADD_LIBC_SYM(atoi);
    ADD_LIBC_SYM(atol);
    ADD_LIBC_SYM(atoll);
    ADD_LIBC_SYM(atof);
    ADD_LIBC_SYM(strtol);
    ADD_LIBC_SYM(strtoll);
    ADD_LIBC_SYM(strtoul);
    ADD_LIBC_SYM(strtoull);
    ADD_LIBC_SYM(strtod);
    ADD_LIBC_SYM(rand);
    ADD_LIBC_SYM(srand);
    ADD_LIBC_SYM(abs);
    ADD_LIBC_SYM(labs);
    ADD_LIBC_SYM(llabs);
    ADD_LIBC_SYM(qsort);
    ADD_LIBC_SYM(bsearch);
    ADD_LIBC_SYM(sin);
    ADD_LIBC_SYM(cos);
    ADD_LIBC_SYM(tan);
    ADD_LIBC_SYM(asin);
    ADD_LIBC_SYM(acos);
    ADD_LIBC_SYM(atan);
    ADD_LIBC_SYM(atan2);
    ADD_LIBC_SYM(sinh);
    ADD_LIBC_SYM(cosh);
    ADD_LIBC_SYM(tanh);
    ADD_LIBC_SYM(exp);
    ADD_LIBC_SYM(log);
    ADD_LIBC_SYM(log10);
    ADD_LIBC_SYM(pow);
    ADD_LIBC_SYM(sqrt);
    ADD_LIBC_SYM(ceil);
    ADD_LIBC_SYM(floor);
    ADD_LIBC_SYM(round);
    ADD_LIBC_SYM(fabs);
    ADD_LIBC_SYM(fmod);
    ADD_LIBC_SYM(strlen);
    ADD_LIBC_SYM(strcmp);
    ADD_LIBC_SYM(strncmp);
    ADD_LIBC_SYM(strcpy);
    ADD_LIBC_SYM(strncpy);
    ADD_LIBC_SYM(strcat);
    ADD_LIBC_SYM(strncat);
    ADD_LIBC_SYM(strchr);
    ADD_LIBC_SYM(strrchr);
    ADD_LIBC_SYM(strstr);
    ADD_LIBC_SYM(strtok);
    ADD_LIBC_SYM(strdup);
    ADD_LIBC_SYM(memset);
    ADD_LIBC_SYM(memcpy);
    ADD_LIBC_SYM(memmove);
    ADD_LIBC_SYM(memcmp);
    ADD_LIBC_SYM(isalpha);
    ADD_LIBC_SYM(isdigit);
    ADD_LIBC_SYM(isalnum);
    ADD_LIBC_SYM(isspace);
    ADD_LIBC_SYM(isupper);
    ADD_LIBC_SYM(islower);
    ADD_LIBC_SYM(toupper);
    ADD_LIBC_SYM(tolower);
    ADD_LIBC_SYM(time);
    ADD_LIBC_SYM(clock);
    ADD_LIBC_SYM(exit);
    ADD_LIBC_SYM(abort);
#undef ADD_LIBC_SYM

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
            bool attached = false;
            if (jvm->GetEnv((void **)&tEnv, JNI_VERSION_1_6) != JNI_OK) {
                jvm->AttachCurrentThread(&tEnv, nullptr);
                attached = true;
            }
            if (tEnv) {
                jstring str = tEnv->NewStringUTF(chunk.c_str());
                tEnv->CallVoidMethod(globalCallback, onStdoutMid, str);
                tEnv->DeleteLocalRef(str);
            }
            if (attached) {
                jvm->DetachCurrentThread();
            }
        },
        [jvm, globalCallback, onStderrMid](const std::string &chunk) {
            JNIEnv *tEnv = nullptr;
            bool attached = false;
            if (jvm->GetEnv((void **)&tEnv, JNI_VERSION_1_6) != JNI_OK) {
                jvm->AttachCurrentThread(&tEnv, nullptr);
                attached = true;
            }
            if (tEnv) {
                jstring str = tEnv->NewStringUTF(chunk.c_str());
                tEnv->CallVoidMethod(globalCallback, onStderrMid, str);
                tEnv->DeleteLocalRef(str);
            }
            if (attached) {
                jvm->DetachCurrentThread();
            }
        }
    );

    int exitCode = main_fn(0, nullptr);

    g_c_pipe_manager.stop();
    tcc_delete(s);
    env->DeleteGlobalRef(globalCallback);

    return exitCode;
}
