#include <jni.h>
#include <string>
#include <dlfcn.h>
#include <android/log.h>
#include <cstdio>
#include "pipe_manager.h"

#define TAG "OfflineCode-CppRunner"
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

static PipeManager g_cpp_pipe_manager;

extern "C" JNIEXPORT void JNICALL
Java_com_offlinecode_runner_engines_CppNativeBridge_writeStdin(
        JNIEnv *env,
        jobject thiz,
        jstring input) {
    const char *text = env->GetStringUTFChars(input, nullptr);
    if (text) {
        g_cpp_pipe_manager.writeStdin(text);
        env->ReleaseStringUTFChars(input, text);
    }
}

extern "C" JNIEXPORT jint JNICALL
Java_com_offlinecode_runner_engines_CppNativeBridge_runSharedLibrary(
        JNIEnv *env,
        jobject thiz,
        jstring libraryPath,
        jobject callback) {

    jclass callbackClass = env->GetObjectClass(callback);
    jmethodID onStdoutMid = env->GetMethodID(callbackClass, "onStdout", "(Ljava/lang/String;)V");
    jmethodID onStderrMid = env->GetMethodID(callbackClass, "onStderr", "(Ljava/lang/String;)V");

    JavaVM *jvm = nullptr;
    env->GetJavaVM(&jvm);
    jobject globalCallback = env->NewGlobalRef(callback);

    const char *path = env->GetStringUTFChars(libraryPath, nullptr);
    LOGD("dlopening library: %s", path);
    void *handle = dlopen(path, RTLD_NOW | RTLD_LOCAL);
    env->ReleaseStringUTFChars(libraryPath, path);

    if (!handle) {
        const char *err = dlerror();
        std::string errStr = "Runtime Error: dlopen failed: ";
        errStr += (err ? err : "unknown error");
        errStr += "\n";
        LOGE("%s", errStr.c_str());
        jstring jErr = env->NewStringUTF(errStr.c_str());
        env->CallVoidMethod(callback, onStderrMid, jErr);
        env->DeleteLocalRef(jErr);
        env->DeleteGlobalRef(globalCallback);
        return -1;
    }

    typedef int (*main_fn_t)(int, char **);
    main_fn_t user_main = (main_fn_t)dlsym(handle, "main");
    if (!user_main) {
        user_main = (main_fn_t)dlsym(handle, "run_main");
    }

    if (!user_main) {
        const char *err = dlerror();
        std::string errStr = "Runtime Error: 'main' function not found in C++ shared library: ";
        errStr += (err ? err : "");
        errStr += "\n";
        LOGE("%s", errStr.c_str());
        jstring jErr = env->NewStringUTF(errStr.c_str());
        env->CallVoidMethod(callback, onStderrMid, jErr);
        env->DeleteLocalRef(jErr);
        dlclose(handle);
        env->DeleteGlobalRef(globalCallback);
        return -2;
    }

    g_cpp_pipe_manager.start(
        [jvm, globalCallback, onStdoutMid](const std::string &out) {
            JNIEnv *tEnv = nullptr;
            bool attached = false;
            if (jvm->GetEnv((void **)&tEnv, JNI_VERSION_1_6) != JNI_OK) {
                jvm->AttachCurrentThread(&tEnv, nullptr);
                attached = true;
            }
            if (tEnv) {
                jstring str = tEnv->NewStringUTF(out.c_str());
                tEnv->CallVoidMethod(globalCallback, onStdoutMid, str);
                tEnv->DeleteLocalRef(str);
            }
            if (attached) {
                jvm->DetachCurrentThread();
            }
        },
        [jvm, globalCallback, onStderrMid](const std::string &err) {
            JNIEnv *tEnv = nullptr;
            bool attached = false;
            if (jvm->GetEnv((void **)&tEnv, JNI_VERSION_1_6) != JNI_OK) {
                jvm->AttachCurrentThread(&tEnv, nullptr);
                attached = true;
            }
            if (tEnv) {
                jstring str = tEnv->NewStringUTF(err.c_str());
                tEnv->CallVoidMethod(globalCallback, onStderrMid, str);
                tEnv->DeleteLocalRef(str);
            }
            if (attached) {
                jvm->DetachCurrentThread();
            }
        }
    );

    int argc = 1;
    char arg0[] = "user_cpp";
    char *argv[] = { arg0, nullptr };

    LOGD("Invoking C++ main...");
    int exitCode = user_main(argc, argv);
    LOGD("C++ main returned: %d", exitCode);

    fflush(stdout);
    fflush(stderr);

    g_cpp_pipe_manager.stop();
    dlclose(handle);

    env->DeleteGlobalRef(globalCallback);
    return exitCode;
}
