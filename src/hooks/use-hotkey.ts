import { useEffect, useCallback, useRef } from "react";
import {
  registerHotkey,
  unregisterHotkeys,
  onHotkeyPressed,
  onHotkeyReleased,
  startRecording,
  stopRecording,
  loadModel,
  transcribeAudio,
  injectText,
  addTranscription,
  showRecordingOverlay,
  hideRecordingOverlay,
} from "@/lib/voice-api";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { useAppStore } from "@/store";

export function useHotkey() {
  const {
    setupComplete,
    settings,
    selectedModel,
    setRecordingStatus,
    setLastTranscription,
    setErrorMessage,
  } = useAppStore();
  const isRecordingRef = useRef(false);
  const unlistenPressedRef = useRef<UnlistenFn | null>(null);
  const unlistenReleasedRef = useRef<UnlistenFn | null>(null);

  const currentHotkey =
    settings.hotkeyMode === "push-to-talk"
      ? settings.pushToTalkKey
      : settings.toggleKey;

  // Refs so the listeners always see current values without re-binding
  const settingsRef = useRef(settings);
  const selectedModelRef = useRef(selectedModel);
  useEffect(() => {
    settingsRef.current = settings;
    selectedModelRef.current = selectedModel;
  }, [settings, selectedModel]);

  const isEnabled = setupComplete;

  // Show / hide the OS-level recording overlay. We fire-and-forget because
  // show/hide are best-effort UI hints — failing to show the overlay must
  // not block the actual recording from starting.
  const showOverlay = useCallback(() => {
    if (settingsRef.current.showRecordingOverlay) {
      showRecordingOverlay(settingsRef.current.recordingOverlayPosition).catch((err) => {
        console.warn("Failed to show recording overlay:", err);
      });
    }
  }, []);

  const hideOverlay = useCallback(() => {
    hideRecordingOverlay().catch((err) => {
      console.warn("Failed to hide recording overlay:", err);
    });
  }, []);

  // Handle recording start
  const handleRecordingStart = useCallback(async () => {
    if (isRecordingRef.current) return;

    try {
      const model = selectedModelRef.current;
      const lang = settingsRef.current.language;

      // Start recording first so audio capture isn't blocked by the model
      // load. The Rust backend caches the loaded model by (model_id,
      // language), so a steady-state press completes in <50ms; only the
      // very first press (or a model/language change) pays the 3-4s ONNX
      // load, and that happens during the background preload effect.
      const recordingPromise = startRecording();

      if (model?.id) {
        await loadModel(model.id, lang);
      }

      await recordingPromise;
      isRecordingRef.current = true;
      setRecordingStatus("recording");
      showOverlay();
    } catch (error) {
      console.error("Failed to start recording:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start recording",
      );
    }
  }, [setRecordingStatus, setErrorMessage, showOverlay]);

  // Handle recording stop
  const handleRecordingStop = useCallback(async () => {
    if (!isRecordingRef.current) return;

    try {
      setRecordingStatus("processing");
      hideOverlay();

      const audioData = await stopRecording();

      const text = await transcribeAudio(audioData);

      if (text) {
        await injectText(text);

        const model = selectedModelRef.current;
        const lang = settingsRef.current.language;
        if (model?.id) {
          await addTranscription(text, model.id, lang, audioData.length);
        }

        setLastTranscription(text);
      }

      isRecordingRef.current = false;
      setRecordingStatus("idle");
    } catch (error) {
      console.error("Failed to stop recording:", error);
      isRecordingRef.current = false;
      hideOverlay();
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to transcribe",
      );
      setRecordingStatus("error");
      setTimeout(() => setRecordingStatus("idle"), 2000);
    }
  }, [
    setRecordingStatus,
    setLastTranscription,
    setErrorMessage,
    hideOverlay,
  ]);

  // Register hotkey + set up listeners. Re-runs only when the bound hotkey
  // string or the enabled state actually changes.
  useEffect(() => {
    if (!isEnabled || !currentHotkey) {
      return;
    }

    let cancelled = false;

    // Register the hotkey. Await it so the cleanup that unregisters runs
    // only after a real registration is in place.
    (async () => {
      try {
        await registerHotkey(currentHotkey);
        if (cancelled) {
          await unregisterHotkeys().catch(console.error);
        }
      } catch (err) {
        console.error("Failed to register hotkey:", err);
      }
    })();

    // The global-shortcut plugin reports "pressed" and "released" events
    // but the platform can fire them in either order, and on Windows
    // they're often both reported on a single press-release. We treat any
    // event as a user-initiated interaction:
    //
    //   * Push-to-talk: first event starts, second event stops.
    //   * Toggle: each event flips the state, but events arriving within
    //     PAIR_MS are debounced so a press-release pair counts as one tap.
    //
    // The visible overlay mirrors the recording state via
    // handleRecordingStart / handleRecordingStop, so the indicator always
    // appears when recording starts and disappears when it stops.

    let lastEventAt = 0;
    let pendingAction: "start" | "stop" | null = null;
    const PAIR_MS = 250;

    const trigger = () => {
      const mode = settingsRef.current.hotkeyMode;
      if (mode === "push-to-talk") {
        if (pendingAction === "start") {
          pendingAction = "stop";
          handleRecordingStop();
        } else {
          pendingAction = "start";
          handleRecordingStart();
        }
      } else {
        if (isRecordingRef.current) {
          handleRecordingStop();
        } else {
          handleRecordingStart();
        }
      }
    };

    const onEvent = () => {
      const now = Date.now();
      const mode = settingsRef.current.hotkeyMode;

      // In toggle mode, collapse paired events (press+release) to one tap
      if (mode === "toggle" && now - lastEventAt < PAIR_MS) {
        lastEventAt = now;
        return;
      }
      lastEventAt = now;
      trigger();
    };

    onHotkeyPressed(onEvent)
      .then((fn) => {
        if (cancelled) {
          fn();
        } else {
          unlistenPressedRef.current = fn;
        }
      })
      .catch((err) => {
        console.error("Failed to set up onHotkeyPressed:", err);
      });

    onHotkeyReleased(onEvent)
      .then((fn) => {
        if (cancelled) {
          fn();
        } else {
          unlistenReleasedRef.current = fn;
        }
      })
      .catch((err) => {
        console.error("Failed to set up onHotkeyReleased:", err);
      });

    return () => {
      cancelled = true;
      unlistenPressedRef.current?.();
      unlistenPressedRef.current = null;
      unlistenReleasedRef.current?.();
      unlistenReleasedRef.current = null;
      unregisterHotkeys().catch(console.error);
    };
  }, [isEnabled, currentHotkey, handleRecordingStart, handleRecordingStop]);

  // Preload the selected model in the background as soon as setup is
  // complete. This makes the first hotkey press feel instant — the heavy
  // 3-4 second ONNX load happens here, off the hotkey critical path.
  const selectedModelId = selectedModel?.id;
  const selectedModelDownloaded = selectedModel?.downloaded === true;
  const currentLanguage = settings.language;
  const setModelReady = useAppStore((s) => s.setModelReady);
  useEffect(() => {
    if (!isEnabled) return;
    if (!selectedModelId) return;
    if (!selectedModelDownloaded) return;

    // Mark not-ready until this load finishes; if the user spams the
    // hotkey while the load is in flight, the second await will still
    // hit the Rust fast-path so the press isn't blocked twice.
    setModelReady(false);

    let cancelled = false;
    loadModel(selectedModelId, currentLanguage)
      .then(() => {
        if (cancelled) return;
        console.log(`Model ${selectedModelId} preloaded and ready`);
        setModelReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("Background model preload failed:", err);
        setModelReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    isEnabled,
    selectedModelId,
    selectedModelDownloaded,
    currentLanguage,
    setModelReady,
  ]);

  // On unmount, make sure the overlay window isn't left visible
  useEffect(() => {
    return () => {
      hideRecordingOverlay().catch(console.error);
    };
  }, []);

  return {
    isRecording: isRecordingRef.current,
  };
}
