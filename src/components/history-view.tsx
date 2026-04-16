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
import {
  clearTranscriptionHistory,
  deleteTranscriptionItem,
  getTranscriptionHistory,
  getTranscriptionHistoryCount,
  reportError,
  type TranscriptionHistoryItem,
} from "@/lib/voice-api";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  Copy,
  History,
  Loader2,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface HistoryViewProps {
  onClose: () => void;
}

const PAGE_SIZE = 20;

export function HistoryView({ onClose }: HistoryViewProps) {
  const [history, setHistory] = useState<TranscriptionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const hasSearch = debouncedSearchTerm.trim().length > 0;

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error || "Something went wrong");

  const loadHistory = useCallback(async (reset: boolean = false) => {
    const search = debouncedSearchTerm.trim() || undefined;
    if (reset) {
      setIsLoading(true);
      setHistory([]);
      setLoadError(null);
      setActionError(null);
    }
    try {
      const [items, count] = await Promise.all([
        getTranscriptionHistory(PAGE_SIZE, 0, search),
        getTranscriptionHistoryCount(search),
      ]);
      setHistory(items);
      setTotalCount(count);
      setHasMore(items.length < count);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("Failed to load history:", error);
      setLoadError(message);
      await reportError("database", message, "error", {
        userAction: "Load transcription history",
      }).catch(console.error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setActionError(null);
    try {
      const offset = history.length;
      const search = debouncedSearchTerm.trim() || undefined;
      const items = await getTranscriptionHistory(PAGE_SIZE, offset, search);

      if (items.length === 0) {
        setHasMore(false);
      } else {
        setHistory((prev) => [...prev, ...items]);
        setHasMore(history.length + items.length < totalCount);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("Failed to load more history:", error);
      setActionError("Could not load more history.");
      await reportError("database", message, "error", {
        userAction: "Load more transcription history",
      }).catch(console.error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [history.length, totalCount, isLoadingMore, hasMore, debouncedSearchTerm]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !isLoading
        ) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loadMore, hasMore, isLoadingMore, isLoading]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    loadHistory(true);
  }, [loadHistory]);

  const handleCopy = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("Failed to copy:", error);
      setActionError("Could not copy transcription.");
      await reportError("ui", message, "error", {
        userAction: "Copy transcription history item",
      }).catch(console.error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      setActionError(null);
      await deleteTranscriptionItem(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      setTotalCount((prev) => prev - 1);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("Failed to delete:", error);
      setActionError("Could not delete transcription.");
      await reportError("database", message, "error", {
        userAction: "Delete transcription history item",
        context: { id: String(id) },
      }).catch(console.error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    try {
      setIsClearing(true);
      setActionError(null);
      await clearTranscriptionHistory();
      setHistory([]);
      setTotalCount(0);
      setHasMore(false);
      setSearchTerm("");
      setDebouncedSearchTerm("");
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("Failed to clear history:", error);
      setActionError("Could not clear history.");
      await reportError("database", message, "error", {
        userAction: "Clear transcription history",
      }).catch(console.error);
    } finally {
      setIsClearing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;
    return `${minutes}m ${remainingSecs}s`;
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Background mesh gradient */}
      <div className="glass-mesh-bg" />

      {/* Glass Header */}
      <div className="border-b border-white/20 dark:border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="glass-button px-1 py-1 rounded-xl text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4 text-foreground/70" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">History</h1>
          </div>
        </div>
        {history.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="glass-button px-3 py-1.5 rounded-xl text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1.5"
                disabled={isClearing}
              >
                {isClearing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {isClearing ? "Clearing..." : "Clear All"}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card border-0">
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your transcription history.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="glass-button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAll}
                  className="bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600"
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="px-4 py-3 border-b border-white/10 bg-white/20 dark:bg-black/10">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-foreground/45" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search history"
            aria-label="Search transcription history"
            className="h-9 rounded-md border border-white/25 bg-white/65 pl-9 pr-10 text-sm text-foreground shadow-none placeholder:text-foreground/45 transition-colors focus-visible:border-foreground/25 focus-visible:ring-2 focus-visible:ring-foreground/10 dark:border-white/10 dark:bg-white/[0.08] dark:focus-visible:border-white/25"
          />
          {searchTerm && (
            <button
              className="absolute right-2 rounded-md p-1 text-foreground/45 transition-colors hover:bg-foreground/10 hover:text-foreground"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="glass-card p-8 rounded-2xl flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-foreground/60" />
            <p className="text-sm text-foreground/60">Loading history...</p>
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="glass-card p-8 rounded-2xl flex flex-col items-center text-center">
            <div className="p-4 rounded-2xl bg-white/30 dark:bg-white/10 mb-4">
              {loadError ? (
                <AlertCircle className="h-10 w-10 text-red-500" />
              ) : (
                <History className="h-10 w-10 text-foreground/60" />
              )}
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              {loadError
                ? "History unavailable"
                : hasSearch
                  ? "No matches found"
                  : "No transcriptions yet"}
            </h3>
            <p className="text-sm text-foreground/60">
              {loadError ||
                (hasSearch
                  ? "No transcriptions match your search"
                  : "Your transcription history will appear here")}
            </p>
            {hasSearch && !loadError && (
              <button
                className="mt-4 rounded-md px-3 py-1.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
                onClick={() => setSearchTerm("")}
              >
                Clear search
              </button>
            )}
            {loadError && (
              <button
                className="glass-button px-4 py-2 rounded-xl text-sm font-medium mt-4 flex items-center gap-2"
                onClick={() => loadHistory(true)}
                disabled={isLoading}
              >
                <RefreshCcw className="h-4 w-4" />
                Retry
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {actionError && (
              <div className="glass-card p-3 rounded-2xl border-red-500/30 bg-red-500/10 flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{actionError}</span>
              </div>
            )}
            {history.map((item) => (
              <div key={item.id} className="glass-card p-4 rounded-2xl">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-foreground flex-1 break-words leading-relaxed">
                    {item.text}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      className="glass-icon-button p-2 rounded-lg transition-all hover:scale-105"
                      onClick={() => handleCopy(item.text, item.id)}
                    >
                      {copiedId === item.id ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-foreground/60" />
                      )}
                    </button>
                    <button
                      className="glass-icon-button p-2 rounded-lg transition-all hover:scale-105 hover:bg-red-500/10"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-foreground/60">
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/30 dark:bg-white/10">
                    <Clock className="h-3 w-3" />
                    {formatDate(item.created_at)}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-white/30 dark:bg-white/10 capitalize">
                    {item.model_id}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-white/30 dark:bg-white/10 uppercase">
                    {item.language}
                  </span>
                  {item.duration_ms > 0 && (
                    <span className="px-2 py-1 rounded-lg bg-white/30 dark:bg-white/10">
                      {formatDuration(item.duration_ms)}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Load more trigger / indicator */}
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-foreground/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading more...</span>
                </div>
              )}
              {!hasMore && history.length > 0 && (
                <p className="text-sm text-foreground/50">
                  Showing all {totalCount}{" "}
                  {hasSearch ? "matching transcriptions" : "transcriptions"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
