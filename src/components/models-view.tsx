import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  cancelModelDownload,
  deleteModel,
  downloadModel,
  onDownloadProgress,
  reportError,
} from "@/lib/voice-api";
import { useAppStore, useAvailableModels, useIsInitialized } from "@/store";
import {
  getDefaultLanguageForModel,
  getModelCategories,
  getModelLanguageLabel,
  getModelLanguageOptions,
  isLanguageSupportedByModel,
  type ModelBadgeCategory,
  type WhisperModel,
} from "@/types";
import {
  ArrowLeft,
  AlertCircle,
  Check,
  Cpu,
  Download,
  Gauge,
  HardDrive,
  Loader2,
  RefreshCcw,
  Star,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ModelsViewProps {
  onClose: () => void;
}

export function ModelsView({ onClose }: ModelsViewProps) {
  const {
    initializeFromDb,
    selectedModel,
    setSelectedModel,
    settings,
    updateSettings,
    markModelDownloaded,
    setAvailableModels,
  } = useAppStore();
  const availableModels = useAvailableModels();
  const isInitialized = useIsInitialized();
  const { success: toastSuccess, error: toastError } = useToast();

  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(
    null
  );
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [deletingModelId, setDeletingModelId] = useState<string | null>(null);
  const [cancelingModelId, setCancelingModelId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const languageOptions = selectedModel
    ? getModelLanguageOptions(selectedModel)
    : [];
  const selectedLanguage =
    selectedModel && isLanguageSupportedByModel(selectedModel, settings.language)
      ? settings.language
      : languageOptions[0]?.code ?? "en";

  useEffect(() => {
    if (
      selectedModel &&
      !isLanguageSupportedByModel(selectedModel, settings.language)
    ) {
      updateSettings({ language: getDefaultLanguageForModel(selectedModel) });
    }
  }, [selectedModel, settings.language, updateSettings]);

  useEffect(() => {
    const unsubscribe = onDownloadProgress((progress) => {
      if (progress.model_id === downloadingModelId) {
        setDownloadProgress(Math.min(100, Math.max(0, progress.percentage)));
      }
    });

    return () => {
      unsubscribe
        .then((fn) => fn())
        .catch((err) => {
          console.error("Failed to unsubscribe download listener:", err);
        });
    };
  }, [downloadingModelId]);

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "Something went wrong. Please try again.";
  };

  const setRowError = (modelId: string, message: string | null) => {
    setRowErrors((current) => {
      const next = { ...current };
      if (message) {
        next[modelId] = message;
      } else {
        delete next[modelId];
      }
      return next;
    });
  };

  const handleRetryLoad = async () => {
    try {
      setIsRetrying(true);
      setPageError(null);
      await initializeFromDb();
    } catch (err) {
      const message = getErrorMessage(err);
      setPageError(message);
      await reportError("model", message, "error", {
        userAction: "Retry loading model list",
      }).catch(console.error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDownloadModel = async (model: WhisperModel) => {
    if (downloadingModelId || deletingModelId) return;

    try {
      setRowError(model.id, null);
      setDownloadingModelId(model.id);
      setCancelingModelId(null);
      setDownloadProgress(0);

      const modelPath = await downloadModel(model.id);
      markModelDownloaded(model.id, modelPath);
      if (!selectedModel) {
        setSelectedModel({ ...model, downloaded: true });
        updateSettings({ language: getDefaultLanguageForModel(model) });
      }
      toastSuccess("Model downloaded", `${model.name} is ready to use`);
    } catch (err) {
      const message = getErrorMessage(err);
      console.error("Download failed:", err);
      if (message.toLowerCase().includes("cancelled")) {
        toastSuccess("Download canceled", `${model.name} was not installed`);
        return;
      }
      setRowError(model.id, message);
      toastError("Download failed", `Failed to download ${model.name} model`);
      await reportError("model", message, "error", {
        userAction: `Download model: ${model.id}`,
        context: { modelId: model.id },
      }).catch(console.error);
    } finally {
      setDownloadingModelId(null);
      setCancelingModelId(null);
    }
  };

  const handleCancelDownload = async (model: WhisperModel) => {
    if (downloadingModelId !== model.id || cancelingModelId) return;

    try {
      setCancelingModelId(model.id);
      const canceled = await cancelModelDownload(model.id);
      if (!canceled) {
        setCancelingModelId(null);
        setRowError(model.id, "Could not cancel because the download is no longer active.");
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setCancelingModelId(null);
      setRowError(model.id, message);
      await reportError("model", message, "error", {
        userAction: `Cancel model download: ${model.id}`,
        context: { modelId: model.id },
      }).catch(console.error);
    }
  };

  const handleDeleteModel = async (model: WhisperModel) => {
    if (!model.downloaded || downloadingModelId || deletingModelId) return;

    try {
      setRowError(model.id, null);
      setDeletingModelId(model.id);
      await deleteModel(model.id);

      if (selectedModel?.id === model.id) {
        setSelectedModel(null);
      }

      setAvailableModels(
        availableModels.map((availableModel) =>
          availableModel.id === model.id
            ? { ...availableModel, downloaded: false }
            : availableModel
        )
      );
      toastSuccess("Model deleted", `${model.name} has been removed`);
    } catch (err) {
      const message = getErrorMessage(err);
      console.error("Delete failed:", err);
      setRowError(model.id, message);
      toastError("Delete failed", `Failed to delete ${model.name} model`);
      await reportError("model", message, "error", {
        userAction: `Delete model: ${model.id}`,
        context: { modelId: model.id },
      }).catch(console.error);
    } finally {
      setDeletingModelId(null);
    }
  };

  const handleSelectModel = (model: WhisperModel) => {
    if (downloadingModelId || deletingModelId) return;

    if (model.downloaded) {
      setRowError(model.id, null);
      setSelectedModel(model);
      if (!isLanguageSupportedByModel(model, settings.language)) {
        updateSettings({ language: getDefaultLanguageForModel(model) });
      }
    }
  };

  const categoryIcon = (category: ModelBadgeCategory) => {
    if (category === "recommended") {
      return <Star className="h-3.5 w-3.5" />;
    }

    if (category === "accurate") {
      return <Gauge className="h-3.5 w-3.5" />;
    }

    if (category === "fast") {
      return <Zap className="h-3.5 w-3.5" />;
    }

    return <HardDrive className="h-3.5 w-3.5" />;
  };

  const categoryLabel: Record<ModelBadgeCategory, string> = {
    recommended: "Recommended",
    accurate: "Accurate",
    fast: "Fast",
    compact: "Small",
  };

  const isBusy = Boolean(downloadingModelId || deletingModelId);
  const hasModels = availableModels.length > 0;

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <div className="glass-mesh-bg" />

      <div className="border-b border-white/20 dark:border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="glass-button px-1 py-1 rounded-xl text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4 text-foreground/70" />
          </button>
          <h1 className="text-lg font-semibold">Models</h1>
        </div>
        {selectedModel && (
          <span className="glass-status max-w-[150px] truncate text-xs">
            {selectedModel.name}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!isInitialized ? (
          <div className="h-full flex items-center justify-center">
            <div className="glass-card p-8 rounded-2xl flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-foreground/60" />
              <p className="text-sm text-foreground/60">Loading models...</p>
            </div>
          </div>
        ) : !hasModels || pageError ? (
          <div className="h-full flex items-center justify-center">
            <div className="glass-card p-8 rounded-2xl flex flex-col items-center text-center">
              <div className="p-4 rounded-2xl bg-white/30 dark:bg-white/10 mb-4">
                <AlertCircle className="h-10 w-10 text-foreground/60" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                Models unavailable
              </h3>
              <p className="text-sm text-foreground/60">
                {pageError || "The model list could not be loaded."}
              </p>
              <button
                className="glass-button px-4 py-2 rounded-xl text-sm font-medium mt-4 flex items-center gap-2"
                onClick={handleRetryLoad}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Retry
              </button>
            </div>
          </div>
        ) : (
        <div className="glass-card p-4 rounded-2xl space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-white/30 dark:bg-white/10">
              <Cpu className="h-4 w-4 text-foreground/60" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-foreground">
                Transcription Model
              </h2>
              <p className="text-xs text-foreground/60">
                Choose the model used for dictation
              </p>
            </div>
          </div>

          {selectedModel && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground/60 uppercase tracking-wider">
                Spoken Language
              </Label>
              <Select
                value={selectedLanguage}
                onValueChange={(language) => {
                  try {
                    updateSettings({ language });
                  } catch (err) {
                    const message = getErrorMessage(err);
                    setPageError(message);
                    reportError("configuration", message, "error", {
                      userAction: "Change spoken language",
                    }).catch(console.error);
                  }
                }}
                disabled={isBusy || languageOptions.length === 0}
              >
                <SelectTrigger className="glass-button border-0 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-0 max-h-72">
                  {languageOptions.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-foreground/60">
                Only languages supported by {selectedModel.name} are shown.
                Changing this reloads the model before the next recording.
              </p>
            </div>
          )}

          {!selectedModel && (
            <div className="p-3 rounded-xl bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/10">
              <p className="text-sm font-medium text-foreground">
                No active model
              </p>
              <p className="text-xs text-foreground/60 mt-1">
                Download a model, then choose Use to start dictating.
              </p>
            </div>
          )}

          <div className="h-px bg-border/50" />

          <div className="space-y-2">
            {availableModels.map((model) => {
              const isActive = selectedModel?.id === model.id;
              const isDownloading = downloadingModelId === model.id;
              const isCanceling = cancelingModelId === model.id;
              const isDeleting = deletingModelId === model.id;
              const categories = getModelCategories(model);

              return (
                <div
                  key={model.id}
                  className={cn(
                    "p-3 rounded-xl border transition-all",
                    "bg-white/30 dark:bg-white/5 border-white/30 dark:border-white/10",
                    model.downloaded &&
                      "cursor-pointer hover:bg-white/50 dark:hover:bg-white/10",
                    isActive &&
                      "ring-2 ring-foreground/30 border-foreground/20 bg-foreground/5"
                  )}
                  onClick={() => handleSelectModel(model)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">
                          {model.name}
                        </span>
                        {isActive && (
                          <span className="glass-status text-xs bg-foreground/90 text-white px-2 py-0.5 rounded-full font-medium">
                            Active
                          </span>
                        )}
                        {model.downloaded && !isActive && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <Check className="h-3 w-3" />
                            Ready
                          </span>
                        )}
                      </div>
                      {categories.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {categories.map((category) => (
                            <span
                              key={category}
                              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-white/10 text-foreground/60"
                            >
                              {categoryIcon(category)}
                              {categoryLabel[category]}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-foreground/60 mt-1 leading-relaxed">
                        {model.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-foreground/60">
                        <span className="inline-flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {model.size}
                        </span>
                        <span>{getModelLanguageLabel(model)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {model.downloaded ? (
                        <>
                          {!isActive && (
                            <button
                              className="glass-button px-2 py-1 text-xs font-medium rounded-lg"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleSelectModel(model);
                              }}
                              disabled={isBusy}
                            >
                              Use
                            </button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                className="glass-icon-button p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                onClick={(event) => event.stopPropagation()}
                                disabled={isDeleting || isBusy}
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent
                              className="glass-card border-0"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete model?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This removes {model.name} from local storage.
                                  You can download it again later.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="glass-button">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteModel(model)}
                                  disabled={isBusy}
                                  className="bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            className="glass-button px-2 py-1 text-xs font-medium rounded-lg flex items-center gap-1"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDownloadModel(model);
                            }}
                            disabled={downloadingModelId !== null}
                            title={
                              downloadingModelId && !isDownloading
                                ? "Wait for the current download to finish"
                                : undefined
                            }
                          >
                            {isDownloading ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {Math.floor(downloadProgress)}%
                              </>
                            ) : (
                              <>
                                <Download className="h-3 w-3" />
                                Download
                              </>
                            )}
                          </button>
                          {isDownloading && (
                            <button
                              className="glass-icon-button p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleCancelDownload(model);
                              }}
                              disabled={isCanceling}
                              title="Cancel download"
                            >
                              {isCanceling ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isDownloading && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-white/30 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground/80 transition-all duration-300 rounded-full"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-foreground/60 mt-1">
                        {isCanceling
                          ? "Canceling download..."
                          : "Keep Wavee open while this downloads."}
                      </p>
                    </div>
                  )}

                  {rowErrors[model.id] && (
                    <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-red-500">
                            Action failed
                          </p>
                          <p className="text-xs text-red-500/80 mt-0.5 break-words">
                            {rowErrors[model.id]}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
