# Keep JNI entry points and callbacks
-keepclasseswithmembernames class * {
    native <methods>;
}

-keep class com.offlinecode.runner.engines.** { *; }
-keep class com.offlinecode.core.** { *; }
-keep class com.offlinecode.runner.IRunnerService** { *; }
-keep class com.offlinecode.runner.IRunnerCallback** { *; }

# Compose rules are automatically packaged with compose libraries
