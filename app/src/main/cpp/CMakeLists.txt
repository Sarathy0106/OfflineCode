cmake_minimum_required(VERSION 3.22.1)
project(offlinecode LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/tcc
    ${CMAKE_CURRENT_SOURCE_DIR}/python/include
)

# Detect ABI for TCC architecture
if(${ANDROID_ABI} STREQUAL "arm64-v8a")
    set(TCC_ARCH_SOURCES
        tcc/arm64-gen.c
        tcc/arm64-link.c
    )
    add_definitions(-DTCC_TARGET_ARM64)
elseif(${ANDROID_ABI} STREQUAL "armeabi-v7a")
    set(TCC_ARCH_SOURCES
        tcc/arm-gen.c
        tcc/arm-link.c
        tcc/arm-asm.c
    )
    add_definitions(-DTCC_TARGET_ARM)
endif()

add_definitions(
    -DONE_SOURCE=0
    -DTCC_LIBTCC1="libtcc1.a"
)

set(TCC_SOURCES
    tcc/libtcc.c
    tcc/tccpp.c
    tcc/tccgen.c
    tcc/tccelf.c
    tcc/tccasm.c
    tcc/tccrun.c
    ${TCC_ARCH_SOURCES}
)

# Prebuilt libpython3.10.so
add_library(python310 SHARED IMPORTED)
set_target_properties(python310 PROPERTIES
    IMPORTED_LOCATION "${CMAKE_CURRENT_SOURCE_DIR}/../jniLibs/${ANDROID_ABI}/libpython3.10.so"
)

add_library(offlinecode SHARED
    ${TCC_SOURCES}
    pipe_manager.cpp
    tcc_runner.cpp
    python_runner.cpp
    cpp_runner.cpp
)

target_link_libraries(offlinecode
    python310
    dl
    log
    android
)
