# Wavee

Wavee is an open-source desktop voice-to-text app built with Tauri, React, and Rust. It records speech, transcribes it locally with supported AI models, and can insert the result into other applications with optional post-processing.

Audio is processed on your device by default. Model files are downloaded to local app storage and transcription history is stored in a local SQLite database.

## Features

- Local speech-to-text transcription with Whisper-compatible models
- Push-to-talk and toggle recording modes with configurable global hotkeys
- File transcription for common audio formats such as WAV, MP3, M4A, OGG, FLAC, AAC, WebM, and MKV
- Optional post-processing for punctuation, file mentions, code-oriented phrases, and voice commands
- Local transcription history with search, pagination, delete, and clear actions
- Model download and management tools
- Cross-platform desktop packaging through Tauri

## Supported Platforms

- Windows
- macOS
- Linux

Some platform integrations depend on OS permissions and native packages. See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup notes.

## Repository Layout

```text
src/                 React frontend
src-tauri/           Rust/Tauri backend
src-tauri/tests/     Backend integration and E2E tests
scripts/             Release and maintenance scripts
public/              Static frontend assets
.github/             CI, issue templates, and release workflow
```

## Getting Started

### Prerequisites

- Node.js LTS
- pnpm
- Rust stable, minimum Rust 1.81
- Platform dependencies required by Tauri

Install frontend dependencies:

```sh
pnpm install
```

Run the app in development mode:

```sh
pnpm tauri:dev
```

Build the frontend:

```sh
pnpm build
```

Build the desktop app:

```sh
pnpm tauri:build
```

## Testing

Run TypeScript checks:

```sh
pnpm run typecheck
```

Run Rust unit, integration, and backend E2E tests:

```sh
cd src-tauri
cargo test -j 1
```

`-j 1` is recommended on Windows development machines with limited paging-file space because the ONNX Runtime build artifacts are large.

## Data Storage

Settings, app state, license/trial state, and transcription history are stored locally in an SQLite database in the platform app-data directory:

- Windows: `%APPDATA%/com.johuniq.wavee/`
- macOS: `~/Library/Application Support/com.johuniq.wavee/`
- Linux: `~/.config/com.johuniq.wavee/`

Downloaded model files are stored under the app-data models directory.

## Security And Privacy

- Audio is processed locally by default.
- The app uses a restrictive Tauri content security policy.
- Backend commands validate and sanitize inputs before filesystem, database, and transcription operations.
- Sensitive local license cache data is encrypted with AES-256-GCM.

Please report vulnerabilities privately using the process in [SECURITY.md](SECURITY.md).

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [SECURITY.md](SECURITY.md) before opening an issue or pull request.

## License

Wavee is released under the [MIT License](LICENSE).

This repository includes vendored third-party code under `src-tauri/vendor/`. Those components keep their own upstream license files where provided.
