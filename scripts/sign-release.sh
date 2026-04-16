#!/bin/bash
# Sign release files for Tauri updater
# Run this script to generate signatures for your release files

set -e

RELEASE_DIR="./release-signing"
PRIVATE_KEY="$HOME/.tauri/wavee.key"
VERSION="1.0.1"
WINDOWS_SETUP="./src-tauri/target/release/bundle/nsis/Wavee_${VERSION}_x64-setup.exe"
WINDOWS_MSI="./src-tauri/target/release/bundle/msi/Wavee_${VERSION}_x64_en-US.msi"

# Check if private key exists
if [ ! -f "$PRIVATE_KEY" ]; then
    echo "Error: Private key not found at $PRIVATE_KEY"
    echo "Generate one with: pnpm tauri signer generate -w ~/.tauri/wavee.key"
    exit 1
fi

# Check build artifacts exist
if [ ! -f "$WINDOWS_SETUP" ]; then
    echo "Error: Windows setup artifact not found at $WINDOWS_SETUP"
    echo "Build it first with: pnpm tauri build"
    exit 1
fi

if [ ! -f "$WINDOWS_MSI" ]; then
    echo "Error: Windows MSI artifact not found at $WINDOWS_MSI"
    echo "Build it first with: pnpm tauri build"
    exit 1
fi

# Create directory for signing
mkdir -p "$RELEASE_DIR"
cp "$WINDOWS_SETUP" "$RELEASE_DIR/"
cp "$WINDOWS_MSI" "$RELEASE_DIR/"
cd "$RELEASE_DIR"

echo "=== Wavee Release Signing Script ==="
echo ""

echo "Release files:"
ls -la

echo ""
echo "=== Signing files ==="
echo "You'll be prompted for your private key password for each file."
echo ""

# Sign Windows x64
echo "Signing Wavee_${VERSION}_x64-setup.exe..."
pnpm tauri signer sign -k "$PRIVATE_KEY" "Wavee_${VERSION}_x64-setup.exe"

echo ""
echo "=== Signatures generated ==="
echo ""

# Read signatures
SIG_WINDOWS_X64=$(cat "Wavee_${VERSION}_x64-setup.exe.sig")
PUB_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Generate latest.json
cat > latest.json << EOF
{
  "version": "$VERSION",
  "notes": "Wavee v$VERSION - Voice to Text Desktop Application\\n\\n- Local AI voice-to-text\\n- Push-to-talk and toggle modes\\n- Multiple model options\\n- Transcription history search",
  "pub_date": "$PUB_DATE",
  "platforms": {
    "windows-x86_64": {
      "signature": "$SIG_WINDOWS_X64",
      "url": "https://github.com/Johuniq/wavee/releases/download/v$VERSION/Wavee_${VERSION}_x64-setup.exe"
    }
  }
}
EOF

echo "Generated latest.json with signatures:"
cat latest.json

echo ""
echo "=== Next Steps ==="
echo "1. Upload 'latest.json' to your GitHub release v$VERSION"
echo "2. Go to: https://github.com/Johuniq/wavee/releases/edit/v$VERSION"
echo "3. Attach the file: $RELEASE_DIR/latest.json"
echo ""
echo "Files are in: $RELEASE_DIR/"
