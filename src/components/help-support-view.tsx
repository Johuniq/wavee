import { openUrl } from "@/lib/utils";
import {
  ArrowLeft,
  BookOpen,
  Bug,
  ExternalLink,
  HelpCircle,
  Keyboard,
  Mic,
  RefreshCcw,
  Wrench,
} from "lucide-react";

interface HelpSupportViewProps {
  onClose: () => void;
}

const quickFixes = [
  {
    icon: Mic,
    title: "Microphone is not recording",
    text: "Check system microphone permission, then choose the right input device in your OS sound settings.",
  },
  {
    icon: Keyboard,
    title: "Hotkey is not responding",
    text: "Change the shortcut in Settings if another app is already using it.",
  },
  {
    icon: RefreshCcw,
    title: "Transcription feels stuck",
    text: "Stop the current recording, reopen Wavee from the tray, then try a shorter test recording.",
  },
  {
    icon: Wrench,
    title: "Model will not load",
    text: "Open Models and download the active model again if the local files are missing or incomplete.",
  },
];

const supportLinks = [
  {
    icon: BookOpen,
    title: "Release notes",
    text: "Latest builds and update details",
    url: "https://github.com/johuniq/wavee/releases",
  },
  {
    icon: Bug,
    title: "Report a bug",
    text: "Share what happened and what you expected",
    url: "https://github.com/johuniq/wavee/issues/new/choose",
  },
];

export function HelpSupportView({ onClose }: HelpSupportViewProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden relative">
      <div className="glass-mesh-bg" />

      <div className="border-b border-white/20 dark:border-white/10 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={onClose}
          className="glass-button px-1 py-1 rounded-xl text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4 text-foreground/70" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-tight">
            Help & Support
          </h1>
          <p className="text-xs text-foreground/60">
            Quick fixes and support resources
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-white/30 dark:bg-white/10">
              <HelpCircle className="h-4 w-4 text-foreground/60" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-foreground">
                Quick fixes
              </h2>
              <p className="text-xs text-foreground/60">
                Common fixes that solve most issues
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {quickFixes.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-xl bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/10 p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/40 dark:bg-white/10">
                      <Icon className="h-4 w-4 text-foreground/60" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-foreground/60">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-white/30 dark:bg-white/10">
              <Bug className="h-4 w-4 text-foreground/60" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-foreground">
                Support resources
              </h2>
              <p className="text-xs text-foreground/60">
                Get updates or open a report
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {supportLinks.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.title}
                  onClick={() => openUrl(item.url)}
                  className="w-full rounded-xl bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/10 p-3 text-left transition-colors hover:bg-white/45 dark:hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/40 dark:bg-white/10">
                      <Icon className="h-4 w-4 text-foreground/60" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 break-words text-xs text-foreground/60">
                        {item.text}
                      </p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-foreground/40" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
