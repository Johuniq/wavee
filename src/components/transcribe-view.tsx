import { Textarea } from "@/components/ui/textarea";
import { addTranscription, reportError, transcribeFile } from "@/lib/voice-api";
import { useAppStore } from "@/store";
import { open } from "@tauri-apps/plugin-dialog";
import {
  AlertCircle,
  Circle,
  FileAudio,
  Headphones,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";

interface TranscribeViewProps {
  onClose: () => void;
}

export function TranscribeView(_props: TranscribeViewProps) {
  const { settings } = useAppStore();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isSelectingFile, setIsSelectingFile] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getErrorMessage = (err: unknown) =>
    err instanceof Error ? err.message : String(err || "Something went wrong");

  const handleSelectFile = async () => {
    if (isSelectingFile || isTranscribing) return;

    try {
      setIsSelectingFile(true);
      setError(null);
      setWarning(null);
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Audio",
            extensions: [
              "wav",
              "mp3",
              "m4a",
              "ogg",
              "flac",
              "webm",
              "mp4",
              "mov",
            ],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        setSelectedFile(selected);
        setFileName(selected.split(/[/\\]/).pop() || selected);
      }
    } catch (err) {
      const message = getErrorMessage(err);
      console.error("File selection failed:", err);
      setError(message);
      await reportError("filesystem", message, "error", {
        userAction: "Select audio file",
      }).catch(console.error);
    } finally {
      setIsSelectingFile(false);
    }
  };

  const handleTranscribe = async () => {
    if (!selectedFile || isTranscribing) return;

    setIsTranscribing(true);
    setError(null);
    setWarning(null);
    setTranscription("");

    const startTime = Date.now();
    try {
      const text = await transcribeFile(
        selectedFile,
        settings.postProcessingEnabled
      );
      setTranscription(text);

      if (text) {
        const durationMs = Date.now() - startTime;
        try {
          await addTranscription(
            text,
            settings.selectedModelId || "base",
            settings.language,
            durationMs
          );
        } catch (historyErr) {
          const message = getErrorMessage(historyErr);
          console.error("Failed to save to history:", historyErr);
          setWarning("Transcription completed, but history could not be saved.");
          await reportError("database", message, "warning", {
            userAction: "Save file transcription to history",
          }).catch(console.error);
        }
      }
    } catch (err) {
      const message = getErrorMessage(err);
      console.error("Transcription failed:", err);
      setError(message);
      await reportError("transcription", message, "error", {
        userAction: "Transcribe file",
        context: { file: selectedFile },
      }).catch(console.error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = async () => {
    if (!transcription) return;
    try {
      await navigator.clipboard.writeText(transcription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const message = getErrorMessage(err);
      console.error("Copy failed:", err);
      setError(message);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setFileName("");
    setTranscription("");
    setError(null);
    setWarning(null);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas">
      {/* ─── HEADER ─── */}
      <div className="shrink-0 border-b border-hairline">
        <div className="@container max-w-[1280px] mx-auto w-full px-4 sm:px-6 xl:px-10 py-3 sm:py-4">
          <p className="eyebrow-uppercase text-ink-mid">Transcribe</p>
          <h1
            className="display-sm text-ink mt-1"
          >
            From audio file to <span className="text-primary">text</span>.
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="@container max-w-[1280px] mx-auto w-full px-4 sm:px-6 xl:px-10 py-4 xl:py-5 space-y-4 xl:space-y-5">

          {error && (
            <div className="p-3 rounded-md border border-destructive/30 bg-destructive/5 flex items-center gap-2.5 text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="body-sm">{error}</span>
            </div>
          )}

          {warning && (
            <div
              className="p-3 rounded-md border flex items-center gap-2.5"
              style={{
                borderColor: 'rgba(255,79,0,0.3)',
                background: 'rgba(255,79,0,0.06)',
                color: '#ff4f00',
              }}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="body-sm">{warning}</span>
            </div>
          )}

          {/* ─── HERO STATUS BAND — Dark coffee-ink ─── */}
          <section className="hero-band-dark">
            <div className="grid grid-cols-1 @xl:grid-cols-[1.4fr_1fr] gap-4 @xl:gap-6 p-4 sm:p-5 @xl:p-6 items-start @xl:items-center">
              <div className="min-w-0">
                <p className="eyebrow-uppercase text-primary mb-2">
                  <span className="inline-flex items-center gap-2">
                    <Circle className="h-1.5 w-1.5 fill-primary text-primary" />
                    Local transcription
                  </span>
                </p>
                <h2
                  className="display-md text-on-dark"
                >
                  Drop in a file. Get <span className="text-primary">words</span>.
                </h2>
                <p className="body-sm text-on-dark-soft mt-2 max-w-xl">
                  Wavee processes audio entirely on your machine. Pick a recording and we'll turn it into clean, copyable text.
                </p>
              </div>

              <div className="product-ui-card-dark w-full">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="icon-plate-dark">
                    <Headphones className="h-3.5 w-3.5 text-on-dark" />
                  </div>
                  <div className="min-w-0">
                    <p className="caption-strong text-on-dark">Supported formats</p>
                    <p className="caption text-on-dark-soft mt-0.5">8 common audio & video types</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {["WAV", "MP3", "M4A", "OGG", "FLAC", "WEBM", "MP4", "MOV"].map((format) => (
                    <span
                      key={format}
                      className="caption-strong px-2 py-0.5 rounded-md"
                      style={{ background: '#14100e', color: '#c5c0b1', border: '1px solid #36342e' }}
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ─── FILE UPLOAD — Cream surface with large drop zone ─── */}
          {!selectedFile ? (
            <section
              className="card-feature-cream cursor-pointer group transition-all hover:border-ink"
              onClick={handleSelectFile}
            >
              <div className="flex flex-col items-center justify-center text-center py-7 sm:py-9 px-5">
                <div className="icon-plate-orange mb-4 group-hover:scale-105 transition-transform">
                  <Upload className="h-4 w-4" />
                </div>
                <p className="eyebrow-uppercase text-ink-mid mb-2">Step 1</p>
                <h3
                  className="display-md text-ink"
                >
                  Select an audio file
                </h3>
                <p className="body-sm text-body-muted mt-2 max-w-md">
                  Recordings, voice notes, meeting clips, interviews — anything with audio.
                </p>
                <button
                  className="paper-button-primary mt-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSelectingFile}
                >
                  {isSelectingFile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {isSelectingFile ? "Opening..." : "Browse files"}
                </button>
              </div>
            </section>
          ) : (
            <section className="card-feature-cream">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="icon-plate">
                  <FileAudio className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="eyebrow-uppercase text-ink-mid">Step 2</p>
                  <h3
                    className="title-md text-ink mt-0.5"
                  >
                    Ready to transcribe
                  </h3>
                </div>
              </div>

              {/* File row */}
              <div
                className="flex items-center gap-2.5 sm:gap-3 p-3 rounded-md border border-hairline mb-3"
                style={{ background: '#fffefb' }}
              >
                <div className="icon-plate shrink-0">
                  <FileAudio className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="body-sm-strong text-ink truncate"
                    title={fileName}
                  >
                    {fileName}
                  </p>
                  <p className="caption text-body-muted mt-0.5">
                    Loaded · awaiting transcription
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-hairline text-body-muted hover:border-destructive hover:text-destructive transition-colors shrink-0"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                onClick={handleTranscribe}
                disabled={isTranscribing}
                className="paper-button-primary w-full sm:w-auto"
              >
                {isTranscribing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {isTranscribing ? "Transcribing..." : "Transcribe file"}
              </button>
            </section>
          )}

          {/* ─── TRANSCRIPTION RESULT ─── */}
          {transcription && (
            <section className="paper-card">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="eyebrow-uppercase text-ink-mid mb-1">Result</p>
                  <h3
                    className="title-md text-ink"
                  >
                    Transcription
                  </h3>
                </div>
                <button
                  onClick={handleCopy}
                  className="paper-button-outline size-md shrink-0 cursor-pointer"
                  style={{ borderColor: copied ? '#ff4f00' : '#201515', color: copied ? '#ff4f00' : '#201515' }}
                >
                  {copied ? "Copied" : "Copy text"}
                </button>
              </div>

              <Textarea
                readOnly
                value={transcription}
                className="paper-input min-h-[140px] sm:min-h-[180px] resize-none leading-relaxed"
                style={{
                  fontSize: 'var(--type-body-sm)',
                  letterSpacing: '-0.005em',
                  borderRadius: '8px',
                }}
              />

              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                <span className="inline-flex items-center gap-1 caption px-2 py-0.5 rounded-md bg-canvas-soft text-body">
                  {transcription.trim().split(/\s+/).length} words
                </span>
                <span className="inline-flex items-center gap-1 caption px-2 py-0.5 rounded-md bg-canvas-soft text-body">
                  {transcription.length} characters
                </span>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}