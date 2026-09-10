// Build script for Wavee.
//
// GPU acceleration for the Qwen3-ASR model is provided by the `qwen3-asr`
// crate's `cuda` and `metal` Cargo features. We do NOT enable them in
// Cargo.toml directly because:
//
//   1. `cuda` pulls in the CUDA toolchain and fails to build on machines
//      without `nvcc` installed.
//   2. `metal` is macOS-only and would fail on Linux/Windows.
//
// Instead we detect the toolchain at build time and emit
// `cargo:rustc-cfg=feature="cuda"` only when `nvcc --version` succeeds. The
// crate's `best_device()` then picks CUDA → Metal → CPU automatically.
//
// macOS always uses Metal (the `candle-core/metal` feature is enabled
// unconditionally in the vendor crate's default features, but since we
// pass `default-features = false` we need to enable it explicitly here).

use std::process::Command;

fn main() {
    // --- CUDA detection (Linux + Windows) ---
    // Only attempt CUDA on targets where nvcc could plausibly exist.
    #[cfg(any(target_os = "linux", target_os = "windows"))]
    {
        let has_nvcc = Command::new("nvcc")
            .arg("--version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false);

        if has_nvcc {
            println!("cargo:rustc-cfg=feature=\"cuda\"");
            println!("cargo:warning=Qwen3-ASR CUDA acceleration enabled");
        } else {
            println!("cargo:warning=Qwen3-ASR CUDA not detected; using CPU fallback");
        }
    }

    // --- Metal detection (macOS) ---
    // On macOS the Metal feature is always available (it's part of the OS),
    // so we unconditionally enable it. The vendor crate's `best_device()`
    // will pick Metal when the feature is on.
    #[cfg(target_os = "macos")]
    {
        println!("cargo:rustc-cfg=feature=\"metal\"");
        println!("cargo:warning=Qwen3-ASR Metal acceleration enabled");
    }

    // Re-run the build script if the CUDA toolkit is installed/uninstalled
    // so the cfg reflects the current environment.
    println!("cargo:rerun-if-env-changed=CUDA_HOME");
    println!("cargo:rerun-if-env-changed=CUDA_PATH");
    println!("cargo:rerun-if-env-changed=CUDA_TOOLKIT_ROOT_DIR");
    println!("cargo:rerun-if-env-changed=CUDNN_LIB");
}