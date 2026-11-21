#include <jni.h>
#include <string>
#include <cstdlib>
#include "pipe_manager.h"
#include "python/include/Python.h"

static PipeManager g_py_pipe_manager;
static bool g_python_initialized = false;

extern "C" JNIEXPORT void JNICALL
Java_com_offlinecode_runner_engines_PythonNativeBridge_initPython(
        JNIEnv *env,
        jobject thiz,
        jstring pythonHome) {
    if (g_python_initialized) return;

    const char *home = env->GetStringUTFChars(pythonHome, nullptr);
    if (home) {
        wchar_t *prog = Py_DecodeLocale("python3", nullptr);
        Py_SetProgramName(prog);

        wchar_t *wHome = Py_DecodeLocale(home, nullptr);
        Py_SetPythonHome(wHome);

        Py_Initialize();
        g_python_initialized = true;

        PyMem_RawFree(prog);
        PyMem_RawFree(wHome);
        env->ReleaseStringUTFChars(pythonHome, home);
    }
}

extern "C" JNIEXPORT void JNICALL
Java_com_offlinecode_runner_engines_PythonNativeBridge_writeStdin(
        JNIEnv *env,
        jobject thiz,
        jstring input) {
    const char *text = env->GetStringUTFChars(input, nullptr);
    if (text) {
        g_py_pipe_manager.writeStdin(text);
        env->ReleaseStringUTFChars(input, text);
    }
}

extern "C" JNIEXPORT jint JNICALL
Java_com_offlinecode_runner_engines_PythonNativeBridge_runPythonCode(
        JNIEnv *env,
        jobject thiz,
        jstring sourceCode,
        jobject callback) {

    jclass callbackClass = env->GetObjectClass(callback);
    jmethodID onStdoutMid = env->GetMethodID(callbackClass, "onStdout", "(Ljava/lang/String;)V");
    jmethodID onStderrMid = env->GetMethodID(callbackClass, "onStderr", "(Ljava/lang/String;)V");

    JavaVM *jvm = nullptr;
    env->GetJavaVM(&jvm);
    jobject globalCallback = env->NewGlobalRef(callback);

    g_py_pipe_manager.start(
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

    const char *code = env->GetStringUTFChars(sourceCode, nullptr);
    int res = PyRun_SimpleString(code);
    env->ReleaseStringUTFChars(sourceCode, code);

    // Ensure output is flushed
    PyRun_SimpleString("import sys; sys.stdout.flush(); sys.stderr.flush()");

    g_py_pipe_manager.stop();
    env->DeleteGlobalRef(globalCallback);

    return res;
}
