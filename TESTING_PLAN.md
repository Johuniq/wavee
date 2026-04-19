**Rust Backend Test Plan**

Here’s the test plan I’d use before writing anything. I’d split it into layers so we cover the backend properly without pretending every test needs a full Tauri window/app runtime.

**1. Test Structure**
Use three levels of tests:

1. **Unit tests**
   Test pure logic and small backend helpers directly.

2. **Integration tests**
   Test database, license state transitions, trial logic, model metadata, validation guards, and command-level behavior with real temp directories.

3. **End-to-end backend tests**
   Start the backend logic in a realistic app-data environment and simulate user flows:
   first launch, trial start, trial expiry, license activation, validation, deactivation, blocked access.

Because this is Tauri, I would avoid testing through the frontend. The backend E2E tests should call Rust functions/commands or command-adjacent helpers directly.

**2. Core Areas To Cover**

**Database**
Test `Database::new()` and all persisted state behavior:

- Creates DB in a temp app data directory.
- Creates default settings row.
- Creates default app state row.
- Creates default license row.
- Loads default models.
- Updates settings.
- Updates setup state.
- Marks model downloaded.
- Reads model download state back after reopening DB.
- Saves transcription history.
- Queries transcription history.
- Deletes transcription history.
- Clears transcription history.
- Saves license.
- Clears license while preserving trial history.

**Trial Flow**
This is critical because it gates the app:

- New install has no active license and no trial.
- `start_trial` creates a trial.
- Trial has 7 days remaining on day 0.
- Trial allows app access during days 0-6.
- Trial expires at day 7+.
- Trial integrity hash is valid after trial start.
- Tampered trial start fails integrity check.
- Future trial start is rejected.
- Expired trial cannot be restarted.
- Clearing license preserves `trial_started_at`.
- Deactivated license after trial returns to `trial_expired`, not a fresh trial.

To make this testable cleanly, we may want to extract trial calculation into helper functions that accept `now` as a parameter, instead of relying directly on `chrono::Utc::now()` everywhere.

**License Logic**
Cover local license state and safe fallbacks:

- Active DB license allows usage when cache is missing.
- DB license is rejected when missing `license_key`.
- DB license is rejected when missing `activation_id`.
- DB license is rejected when status is not `active`.
- DB license is rejected when `is_activated = false`.
- DB license is rejected when expired.
- DB license is rejected when `last_validated_at` is missing.
- DB license is rejected when validation timestamp is in the future.
- DB license is rejected after offline grace period.
- `get_license` returns active DB license instead of rewriting it to `not_activated`.
- Secure cache is preferred over DB when present.
- No secure cache does not spam warnings.
- License errors serialize to production-safe messages.
- Raw vendor messages like `HTTP 400`, `BadRequest`, and `0 more usages` do not reach serialized command errors.

**License Manager**
Use unit tests with mocked HTTP, ideally `wiremock` or `httpmock`, but the current `POLAR_API_BASE` is a constant. To test this well, we should refactor `LicenseManager` to allow a custom API base URL in tests.

Test cases:

- Activation success stores secure cache.
- Activation response maps customer email/name.
- Activation response maps activation id.
- Activation limit returns friendly message.
- Invalid license returns friendly message.
- Validation success updates secure cache.
- Validation does not send `increment_usage`.
- Validation failure returns friendly message.
- Deactivation success clears secure cache.
- Deactivation 404 clears local cache.
- Deactivation failure returns friendly message.
- DB fallback validation recreates secure cache.
- DB fallback deactivation works when cache is missing.

**Access Guards**
Test command guard behavior:

- Active license passes.
- Active trial passes.
- Expired trial blocks.
- No license and no trial blocks.
- Active DB-backed license passes even when secure cache is absent.
- Tampered trial blocks.
- Linux free access behavior should be covered with `cfg`-aware tests or isolated helper tests.

**Security Helpers**
Cover encryption/masking/tamper behavior:

- `mask_license_key` hides short keys.
- `mask_license_key` masks normal keys.
- Encrypt/decrypt round-trip works.
- Decrypt rejects invalid data.
- Cache integrity hash detects tampering.
- Cache device mismatch is rejected.
- Cache version mismatch is rejected.
- Future validation timestamp is rejected.

**Error Handling**
Test production-safe serialization:

- `CommandError::License("Validate failed: HTTP 400 ...")` serializes safely.
- `CommandError::License("License key only has 0 more usages")` serializes safely.
- `CommandError::License("Network error ...")` serializes to network-friendly copy.
- Non-license errors still serialize normally.
- No raw JSON body is returned to the frontend.

**Audio / Transcription Backend**
Depending on how heavy we want the suite:

Unit/light integration:

- Audio format conversion accepts supported sample formats.
- Unsupported sample format returns expected error.
- Audio file decoder rejects missing file.
- Audio file decoder rejects invalid path.
- Language/model compatibility helper works for English-only models.
- Language/model compatibility helper works for multilingual models.
- Model metadata commands return expected models.
- Missing downloaded model is detected.

Heavy model inference tests should not be in the default test suite because they need large model files. I’d mark those as ignored:

```rust
#[ignore]
#[test]
fn transcribes_known_audio_fixture() {}
```

**Downloader**
Use a mock HTTP server:

- Downloads file to temp model directory.
- Emits/records progress if testable.
- Rejects invalid URL.
- Handles HTTP 404.
- Handles partial network failure.
- Does not mark model downloaded if download fails.
- Marks model downloaded after successful download.

**Text Injection**
This is OS-bound and risky in automated tests. I would keep only safe unit tests unless the code has mockable boundaries.

- Sanitizes text before injection if applicable.
- Clipboard mode logic can be tested if separated.
- Actual keyboard injection should be manual or ignored tests.

**Tauri Command Coverage**
For each backend command, test through either command functions directly or extracted command service helpers:

- `get_settings`
- `update_settings`
- `get_app_state`
- `update_app_state`
- `get_models`
- `get_model`
- `download_model` with mocked downloader
- `get_license`
- `activate_license` with mocked license API
- `validate_license` with mocked license API
- `deactivate_license` with mocked license API
- `clear_stored_license`
- `is_license_valid`
- `start_trial`
- `get_trial_status`
- `can_use_app`
- history commands
- error report commands where practical

**3. Refactors Needed Before Full Tests**
To make “A to Z” testing practical, I’d do a small testability pass first:

1. Extract trial/date logic into pure helpers:
   - `trial_days_remaining(trial_started_at, now)`
   - `trial_is_valid(...)`
   - `calculate_trial_integrity_hash(...)` already exists but can be easier to reuse.

2. Allow `LicenseManager` to use a configurable API base URL in tests:
   - production uses Polar URL
   - tests use local mock server

3. Extract command logic that currently depends on `tauri::State` into service-style helpers:
   - easier to test without booting Tauri runtime
   - Tauri commands become thin wrappers

4. Add temp DB helpers:
   - `test_database() -> (TempDir, Database)`
   - `expired_trial_db()`
   - `active_license_db()`

5. Add fixture builders:
   - `LicenseDataBuilder`
   - `CachedLicenseBuilder`
   - mock Polar activation/validation responses

**4. Test Files I’d Add**
Suggested layout:

```text
src-tauri/src/database.rs
  existing unit tests or module-level tests

src-tauri/src/license.rs
  license manager/cache/security unit tests

src-tauri/src/lib.rs
  command/access/trial helper tests

src-tauri/tests/database_integration.rs
src-tauri/tests/license_flow_integration.rs
src-tauri/tests/trial_flow_integration.rs
src-tauri/tests/access_guard_integration.rs
src-tauri/tests/error_serialization.rs
src-tauri/tests/downloader_integration.rs
```

If we refactor into modules later, we can move tests closer to each module.

**5. Test Dependencies**
Add dev dependencies:

```toml
[dev-dependencies]

tempfile = "3.23.0"
httpmock = "0.7"
serial_test = "3"
serde_json = "1"
```

Possibly:

```toml
assert_fs = "1"
predicates = "3"
```

`serial_test` is useful because license cache paths currently use global OS data dirs. Better long term is to make cache dir injectable in tests.

**6. Priority Order**
I’d implement in this order:

1. **License/trial/access tests first**
   These are the riskiest and most recently changed.

2. **Error sanitization tests**
   Prevent raw vendor errors from coming back.

3. **Database persistence tests**
   Make sure app state survives restart.

4. **License manager mocked HTTP tests**
   Covers activation/validation/deactivation properly.

5. **Downloader tests**
   Useful but separate from licensing.

6. **Audio/transcription lightweight tests**
   Avoid large model inference in the default suite.

**7. Definition Of Done**
The backend test suite is “full enough” when:

- `cargo test` passes on a clean machine.
- Tests do not require real Polar credentials.
- Tests do not require network except local mock server.
- Tests do not require downloaded AI models.
- Trial expiry can be tested deterministically without changing system time.
- License activation/validation/deactivation flows are covered against mocked API responses.
- Raw production-sensitive errors are proven not to serialize to UI.
- DB-backed fallback license behavior is covered.
- Secure cache missing/corrupt/tampered behavior is covered.
- Access guard behavior is covered for licensed, trial, expired, and blocked states.
