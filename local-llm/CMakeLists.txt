cmake_minimum_required(VERSION 3.18)
project(greenlane-local VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Options
option(USE_EXECUTORCH "Enable ExecuTorch integration" OFF)

# Find threads
find_package(Threads REQUIRED)

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/include)
include_directories(${CMAKE_SOURCE_DIR}/src)

# Source files
set(SOURCES
    src/main.cpp
    src/inference.cpp
    src/tokenizer.cpp
)

# Main executable
add_executable(greenlane-local ${SOURCES})

# Link libraries
target_link_libraries(greenlane-local PRIVATE Threads::Threads)

# Platform-specific settings
if(APPLE)
    target_link_libraries(greenlane-local PRIVATE "-framework Foundation")
    # For ExecuTorch on macOS
    if(USE_EXECUTORCH)
        # ExecuTorch paths - update these for your system
        set(EXECUTORCH_ROOT "$ENV{HOME}/executorch" CACHE PATH "ExecuTorch installation")
        if(EXISTS ${EXECUTORCH_ROOT})
            include_directories(${EXECUTORCH_ROOT}/include)
            link_directories(${EXECUTORCH_ROOT}/lib)
            target_link_libraries(greenlane-local PRIVATE executorch executorch_no_prim_ops)
            target_compile_definitions(greenlane-local PRIVATE USE_EXECUTORCH=1)
        endif()
    endif()
endif()

# Install
install(TARGETS greenlane-local DESTINATION bin)

# Print configuration
message(STATUS "GreenLane Local LLM Server")
message(STATUS "  ExecuTorch: ${USE_EXECUTORCH}")
message(STATUS "  C++ Standard: ${CMAKE_CXX_STANDARD}")
