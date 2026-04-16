// WaveType - Type Definitions

// Available Whisper models for offline transcription
export interface WhisperModel {
  id: string;
  name: string;
  size: string; // e.g., "75 MB", "1.5 GB"
  sizeBytes: number;
  description: string;
  languages: string[];
  recommended?: boolean;
  downloaded?: boolean;
  downloadProgress?: number; // 0-100
}

// App settings
export interface AppSettings {
  // Hotkey configuration
  pushToTalkKey: string;
  toggleKey: string;
  hotkeyMode: "push-to-talk" | "toggle";

  // Language settings
  language: string;

  // Model settings
  selectedModelId: string;

  // UI preferences
  showRecordingIndicator: boolean;
  playAudioFeedback: boolean;
  showRecordingOverlay: boolean; // Show fullscreen wave overlay when recording

  // Post-processing
  postProcessingEnabled: boolean;

  // Output mode
  clipboardMode: boolean; // true = copy to clipboard, false = inject text

  // Advanced
  autoStartOnBoot: boolean;
  minimizeToTray: boolean;
}

// Recording state
export type RecordingStatus = "idle" | "recording" | "processing" | "error";

// Model download status
export type ModelStatus =
  | "not-downloaded"
  | "downloading"
  | "downloaded"
  | "loading"
  | "ready"
  | "error";

// License status
export type LicenseStatus =
  | "active"
  | "inactive"
  | "expired"
  | "revoked"
  | "disabled"
  | "invalid"
  | "not_activated"
  | "activation_limit";

// License data
export interface LicenseData {
  licenseKey: string | null;
  activationId: string | null;
  status: LicenseStatus;
  customerEmail: string | null;
  customerName: string | null;
  expiresAt: string | null;
  isActivated: boolean;
  lastValidatedAt: string | null;
}

// App state
export interface AppState {
  // Setup flow
  isFirstLaunch: boolean;
  setupComplete: boolean;
  currentSetupStep: number;

  // Recording
  recordingStatus: RecordingStatus;
  lastTranscription: string;
  errorMessage: string | null;

  // Model
  modelStatus: ModelStatus;
  selectedModel: WhisperModel | null;
  downloadProgress: number;

  // Settings
  settings: AppSettings;
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  pushToTalkKey: "Alt+Shift+S",
  toggleKey: "Alt+Shift+D",
  hotkeyMode: "push-to-talk",
  language: "en",
  selectedModelId: "base",
  showRecordingIndicator: true,
  playAudioFeedback: true,
  showRecordingOverlay: true,
  postProcessingEnabled: true,
  clipboardMode: false,
  autoStartOnBoot: false,
  minimizeToTray: true,
};

// Model categories for UI grouping
export type ModelCategory = "standard" | "english" | "distil" | "large";

export const PARAKEET_V3_LANGUAGES = [
  "bg",
  "hr",
  "cs",
  "da",
  "nl",
  "en",
  "et",
  "fi",
  "fr",
  "de",
  "el",
  "hu",
  "it",
  "lv",
  "lt",
  "mt",
  "pl",
  "pt",
  "ro",
  "sk",
  "sl",
  "es",
  "sv",
  "ru",
  "uk",
];

export const WHISPER_MULTILINGUAL_LANGUAGES = [
  "en",
  "zh",
  "de",
  "es",
  "ru",
  "ko",
  "fr",
  "ja",
  "pt",
  "tr",
  "pl",
  "ca",
  "nl",
  "ar",
  "sv",
  "it",
  "id",
  "hi",
  "fi",
  "vi",
  "he",
  "uk",
  "el",
  "ms",
  "cs",
  "ro",
  "da",
  "hu",
  "ta",
  "no",
  "th",
  "ur",
  "hr",
  "bg",
  "lt",
  "la",
  "mi",
  "ml",
  "cy",
  "sk",
  "te",
  "fa",
  "lv",
  "bn",
  "sr",
  "az",
  "sl",
  "kn",
  "et",
  "mk",
  "br",
  "eu",
  "is",
  "hy",
  "ne",
  "mn",
  "bs",
  "kk",
  "sq",
  "sw",
  "gl",
  "mr",
  "pa",
  "si",
  "km",
  "sn",
  "yo",
  "so",
  "af",
  "oc",
  "ka",
  "be",
  "tg",
  "sd",
  "gu",
  "am",
  "yi",
  "lo",
  "uz",
  "fo",
  "ht",
  "ps",
  "tk",
  "nn",
  "mt",
  "sa",
  "lb",
  "my",
  "bo",
  "tl",
  "mg",
  "as",
  "tt",
  "haw",
  "ln",
  "ha",
  "ba",
  "jw",
];

export const QWEN3_ASR_LANGUAGES = [
  "zh",
  "en",
  "yue",
  "ar",
  "de",
  "fr",
  "es",
  "pt",
  "id",
  "it",
  "ko",
  "ru",
  "th",
  "vi",
  "ja",
  "tr",
  "hi",
  "ms",
  "nl",
  "sv",
  "da",
  "fi",
  "pl",
  "cs",
  "fil",
  "fa",
  "el",
  "hu",
  "mk",
  "ro",
];

export const LANGUAGE_NAMES: Record<string, string> = {
  auto: "Auto detect",
  af: "Afrikaans",
  am: "Amharic",
  ar: "Arabic",
  as: "Assamese",
  az: "Azerbaijani",
  ba: "Bashkir",
  be: "Belarusian",
  bg: "Bulgarian",
  bn: "Bengali",
  bo: "Tibetan",
  br: "Breton",
  bs: "Bosnian",
  ca: "Catalan",
  cs: "Czech",
  cy: "Welsh",
  da: "Danish",
  de: "German",
  el: "Greek",
  en: "English",
  es: "Spanish",
  et: "Estonian",
  eu: "Basque",
  fa: "Persian",
  fi: "Finnish",
  fil: "Filipino",
  fo: "Faroese",
  fr: "French",
  gl: "Galician",
  gu: "Gujarati",
  ha: "Hausa",
  haw: "Hawaiian",
  he: "Hebrew",
  hi: "Hindi",
  hr: "Croatian",
  ht: "Haitian Creole",
  hu: "Hungarian",
  hy: "Armenian",
  id: "Indonesian",
  is: "Icelandic",
  it: "Italian",
  ja: "Japanese",
  jw: "Javanese",
  ka: "Georgian",
  kk: "Kazakh",
  km: "Khmer",
  kn: "Kannada",
  ko: "Korean",
  la: "Latin",
  lb: "Luxembourgish",
  ln: "Lingala",
  lo: "Lao",
  lt: "Lithuanian",
  lv: "Latvian",
  mg: "Malagasy",
  mi: "Maori",
  mk: "Macedonian",
  ml: "Malayalam",
  mn: "Mongolian",
  mr: "Marathi",
  ms: "Malay",
  mt: "Maltese",
  my: "Myanmar",
  ne: "Nepali",
  nl: "Dutch",
  nn: "Nynorsk",
  no: "Norwegian",
  oc: "Occitan",
  pa: "Punjabi",
  pl: "Polish",
  ps: "Pashto",
  pt: "Portuguese",
  ro: "Romanian",
  ru: "Russian",
  sa: "Sanskrit",
  sd: "Sindhi",
  si: "Sinhala",
  sk: "Slovak",
  sl: "Slovenian",
  sn: "Shona",
  so: "Somali",
  sq: "Albanian",
  sr: "Serbian",
  su: "Sundanese",
  sv: "Swedish",
  sw: "Swahili",
  ta: "Tamil",
  te: "Telugu",
  tg: "Tajik",
  th: "Thai",
  tk: "Turkmen",
  tl: "Tagalog",
  tr: "Turkish",
  tt: "Tatar",
  uk: "Ukrainian",
  ur: "Urdu",
  uz: "Uzbek",
  vi: "Vietnamese",
  yue: "Cantonese",
  yi: "Yiddish",
  yo: "Yoruba",
  zh: "Chinese",
};

export interface LanguageOption {
  code: string;
  name: string;
}

export function getModelLanguageLabel(model: Pick<WhisperModel, "languages">) {
  if (model.languages.includes("multilingual")) {
    return "Multilingual";
  }

  if (model.languages.length === 1 && model.languages[0] === "en") {
    return "English";
  }

  if (model.languages.length === PARAKEET_V3_LANGUAGES.length) {
    return "25 languages";
  }

  if (model.languages.length === QWEN3_ASR_LANGUAGES.length) {
    return "30 languages";
  }

  return model.languages.map((language) => language.toUpperCase()).join(", ");
}

export function getModelLanguageOptions(
  model: Pick<WhisperModel, "id" | "languages">
): LanguageOption[] {
  const languageCodes = model.languages.includes("multilingual")
    ? WHISPER_MULTILINGUAL_LANGUAGES
    : model.languages;
  const options = languageCodes.map((code) => ({
    code,
    name: LANGUAGE_NAMES[code] ?? code.toUpperCase(),
  }));

  if (
    model.languages.includes("multilingual") ||
    model.id === "parakeet-v3" ||
    model.id.startsWith("qwen3-asr-")
  ) {
    return [{ code: "auto", name: "Auto detect" }, ...options];
  }

  return options;
}

export function isLanguageSupportedByModel(
  model: Pick<WhisperModel, "id" | "languages">,
  language: string
) {
  return getModelLanguageOptions(model).some((option) => option.code === language);
}

export function getDefaultLanguageForModel(
  model: Pick<WhisperModel, "id" | "languages">
) {
  const options = getModelLanguageOptions(model);
  return options[0]?.code ?? "en";
}

export type ModelBadgeCategory = "recommended" | "accurate" | "fast" | "compact";

export function getModelCategories(model: WhisperModel): ModelBadgeCategory[] {
  const categories: ModelBadgeCategory[] = [];

  if (model.recommended) {
    categories.push("recommended");
  }

  if (
    model.id.startsWith("qwen3-asr-") ||
    model.id.includes("large") ||
    model.id === "medium" ||
    model.id === "medium.en"
  ) {
    categories.push("accurate");
  }

  if (
    model.id.includes("distil") ||
    model.id.includes("tiny") ||
    model.id.includes("base") ||
    model.id.startsWith("parakeet-")
  ) {
    categories.push("fast");
  }

  if (model.sizeBytes <= 200 * 1024 * 1024) {
    categories.push("compact");
  }

  return categories;
}

// Available transcription models
export const WHISPER_MODELS: WhisperModel[] = [
  // ========== RECOMMENDED ==========
  {
    id: "distil-medium.en",
    name: "Distil Whisper Medium English",
    size: "390 MB",
    sizeBytes: 390 * 1024 * 1024,
    description: "Recommended English model for fast, accurate dictation.",
    languages: ["en"],
    recommended: true,
  },

  // ========== STANDARD WHISPER (Multilingual) ==========
  {
    id: "tiny",
    name: "Whisper Tiny",
    size: "75 MB",
    sizeBytes: 75 * 1024 * 1024,
    description:
      "Fastest Whisper model. Best for quick notes and low-resource devices.",
    languages: ["multilingual"],
  },
  {
    id: "base",
    name: "Whisper Base",
    size: "142 MB",
    sizeBytes: 142 * 1024 * 1024,
    description: "Balanced Whisper model for everyday transcription.",
    languages: ["multilingual"],
  },
  {
    id: "small",
    name: "Whisper Small",
    size: "466 MB",
    sizeBytes: 466 * 1024 * 1024,
    description:
      "Improved accuracy for longer dictation, meetings, and focused writing.",
    languages: ["multilingual"],
  },
  {
    id: "medium",
    name: "Whisper Medium",
    size: "1.5 GB",
    sizeBytes: 1.5 * 1024 * 1024 * 1024,
    description: "High-accuracy multilingual transcription for demanding audio.",
    languages: ["multilingual"],
  },

  // ========== ENGLISH-ONLY (Faster) ==========
  {
    id: "tiny.en",
    name: "Whisper Tiny English",
    size: "75 MB",
    sizeBytes: 75 * 1024 * 1024,
    description: "Fastest English-only Whisper model. Great for quick notes.",
    languages: ["en"],
  },
  {
    id: "base.en",
    name: "Whisper Base English",
    size: "142 MB",
    sizeBytes: 142 * 1024 * 1024,
    description: "Fast English-only Whisper model with good accuracy.",
    languages: ["en"],
  },
  {
    id: "small.en",
    name: "Whisper Small English",
    size: "466 MB",
    sizeBytes: 466 * 1024 * 1024,
    description: "Accurate English-only Whisper model for longer dictation.",
    languages: ["en"],
  },
  {
    id: "medium.en",
    name: "Whisper Medium English",
    size: "1.5 GB",
    sizeBytes: 1.5 * 1024 * 1024 * 1024,
    description: "High-accuracy English-only Whisper model.",
    languages: ["en"],
  },

  // ========== DISTIL-WHISPER (Faster) ==========
  {
    id: "distil-small.en",
    name: "Distil Whisper Small English",
    size: "166 MB",
    sizeBytes: 166 * 1024 * 1024,
    description: "Fast English transcription with accuracy close to Whisper Small.",
    languages: ["en"],
  },
  {
    id: "distil-large-v2",
    name: "Distil Whisper Large v2",
    size: "756 MB",
    sizeBytes: 756 * 1024 * 1024,
    description: "Fast large English model with strong accuracy.",
    languages: ["en"],
  },
  {
    id: "distil-large-v3",
    name: "Distil Whisper Large v3",
    size: "756 MB",
    sizeBytes: 756 * 1024 * 1024,
    description:
      "Latest Distil Whisper model with excellent English transcription quality.",
    languages: ["en"],
  },

  // ========== LARGE MODELS (Best Accuracy) ==========
  {
    id: "large-v3",
    name: "Whisper Large v3",
    size: "2.9 GB",
    sizeBytes: 2.9 * 1024 * 1024 * 1024,
    description: "Highest-accuracy Whisper model for professional workflows.",
    languages: ["multilingual"],
  },
  {
    id: "large-v3-turbo",
    name: "Whisper Large v3 Turbo",
    size: "1.6 GB",
    sizeBytes: 1.6 * 1024 * 1024 * 1024,
    description:
      "Fast large Whisper model with a strong speed and accuracy balance.",
    languages: ["multilingual"],
  },
];

export const PARAKEET_MODELS: WhisperModel[] = [
  {
    id: "parakeet-v3",
    name: "Parakeet v3",
    size: "670 MB",
    sizeBytes: 670 * 1024 * 1024,
    description:
      "Fast multilingual Parakeet model with automatic language detection.",
    languages: PARAKEET_V3_LANGUAGES,
    recommended: true,
  },
  {
    id: "parakeet-v2",
    name: "Parakeet v2",
    size: "661 MB",
    sizeBytes: 661 * 1024 * 1024,
    description: "Previous Parakeet English model with stable transcription quality.",
    languages: ["en"],
  },
];

export const QWEN3_ASR_MODELS: WhisperModel[] = [
  {
    id: "qwen3-asr-0.6b",
    name: "Qwen3-ASR 0.6B",
    size: "1.9 GB",
    sizeBytes: 1880 * 1024 * 1024,
    description:
      "Qwen3-ASR speech recognition model for accurate multilingual transcription.",
    languages: QWEN3_ASR_LANGUAGES,
  },
];

export const ALL_MODELS = [
  ...WHISPER_MODELS,
  ...PARAKEET_MODELS,
  ...QWEN3_ASR_MODELS,
];
