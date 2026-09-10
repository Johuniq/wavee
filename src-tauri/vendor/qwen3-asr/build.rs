// Build script for the vendored qwen3-asr crate.
//
// GPU acceleration is provided by Candle's `cuda` and `metal` Cargo
// features, which pull in platform toolchains (nvcc / the macOS SDK).
// Enabling them unconditionally breaks the build on machines without the
// toolkit, so we detect the toolchain here and emit cfg flags that the
// crate's `best_device()` uses to pick the right backend.
//
// The crate's own `cuda`/`metal` Cargo features remain available for users
// who want to force a specific backend, but they are NOT enabled by default.

use std::process::Command;

fn main() {
    // --- CUDA detection (Linux + Windows) ---
    #[cfg(any(target_os = "linux", target_os = "windows"))]
    {
        let has_nvcc = Command::new("nvcc")
            .arg("--version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false);

        if has_nvcc {
            println!("cargo:rustc-cfg=feature:cuda");
            println!("cargo:warning=qwen3-asr: CUDA toolkit detected; enabling GPU acceleration");
        } else {
            println!("cargo:warning=qwen3-asr: CUDA toolkit not found; using CPU fallback");
        }
    }

    // --- Metal detection (macOS) ---
    // Metal is part of the macOS SDK and is always available, so we
    // unconditionally enable it on macOS.
    #[cfg(target_os = "macos")]
    {
        println!("cargo:rustc-cfg=feature:metal");
        println!("cargo:warning=qwen3-asr: Metal acceleration enabled");
    }

    // Re-run if the toolkit is installed/uninstalled.
    println!("cargo:rerun-if-env-changed=CUDA_HOME");
    println!("cargo:rerun-if-env-changed=CUDA_PATH");
    println!("cargo:rerun-if-env-changed=CUDA_TOOLKIT_ROOT_DIR");
}