# OfflineCode: Offline Compiler & Runner for Android

An open-source Android app that allows developers and students to write, compile, and execute **Python, C, and Java** (with optional C++) completely offline directly on Android devices.

No internet permission. No accounts. No analytics. No ads.

---

## Key Highlights

- **100% Offline**: The base APK does not even request the `android.permission.INTERNET` permission.
- **Isolated Process Execution**: User code runs inside an isolated worker process (`:runner`) protected by memory caps (256 MB) and strict execution timeouts (default 10s). Infinite loops or native crashes never freeze the IDE.
- **W^X & Modern Android Compliance**: Compliant with Android 10+ W^X (`noexec` on writable storage) by compiling C directly in memory via `libtcc`, packaging shared libraries in `nativeLibraryDir`, and executing dexed Java via `DexClassLoader`.
- **Full IDE Experience**:
  - Jetpack Compose interface with line numbering and syntax highlighting.
  - Interactive stdin console with real-time stdout and stderr streaming.
  - Dedicated programmer symbol accessory row above the keyboard.
  - Snippets manager to save and load code snippets locally.
  - Configurable dark/light themes, editor font scaling, and execution limits.

---

## Architecture

```
app/
├── ui/              # Jetpack Compose UI, code editor, interactive console, settings
├── runner/          # Isolated background execution service (process=":runner")
│   ├── engines/     # Language engine drivers (C via libtcc, Python, Java via ECJ+D8)
│   └── aidl/        # IPC contract between UI and runner
└── core/            # Common domain models, limits, snippets, and event definitions
```

### Execution Strategy

- **C Engine (`libtcc`)**: TinyCC compiled into `libofflinecode.so`. Compiles user C code directly into memory buffers with `mprotect(PROT_READ | PROT_EXEC)` and invokes `main()` without writing executable binaries to storage.
- **Python Engine (`CPython 3.10`)**: Embedded native CPython linked via JNI. Executes user scripts with standard library access extracted to private internal storage.
- **Java Engine (`ECJ` + `D8`)**: Compiles `.java` files to `.class` bytecode using the Eclipse Compiler for Java (ECJ), converts them into Android DEX format via `D8`, marks the jar read-only for Android 14+ security, and executes using `DexClassLoader`.

---

## Building from Source

### Prerequisites

- Android SDK with Build Tools 35.0.0+ and Platform 35.
- Android NDK `27.0.12077973` or later.
- JDK 17 or 21.

### Commands

To assemble the debug APK:
```bash
./gradlew assembleDebug
```

To install on a connected device:
```bash
./gradlew installDebug
```

To generate an Android App Bundle (AAB) for release:
```bash
./gradlew bundleRelease
```

---

## License

App code is licensed under the [MIT License](LICENSE).  
Bundled engines retain their respective open-source licenses detailed in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
