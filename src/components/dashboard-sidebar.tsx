import { useToast } from "@/hooks/use-toast";
import { checkForUpdates, getCurrentVersion } from "@/lib/updater-api";
import { cn } from "@/lib/utils";
import {
  BookText,
  Cpu,
  FileAudio,
  HelpCircle,
  History,
  Key,
  LayoutDashboard,
  RefreshCw,
  Settings,
  Sliders,
} from "lucide-react";
import { useEffect, useState } from "react";

export type Page = "overview" | "history" | "models" | "transcribe" | "license" | "settings" | "advanced" | "vocabulary" | "help";

type NavItem =
  | { type: "item"; id: Page; label: string; icon: React.ElementType }
  | { type: "header"; label: string };

const navItems: NavItem[] = [
  { type: "header", label: "General" },
  { type: "item", id: "overview", label: "Overview", icon: LayoutDashboard },
  { type: "item", id: "history", label: "History", icon: History },
  { type: "header", label: "Transcription" },
  { type: "item", id: "models", label: "Models", icon: Cpu },
  { type: "item", id: "transcribe", label: "Transcribe", icon: FileAudio },
  { type: "header", label: "Account" },
  { type: "item", id: "license", label: "License", icon: Key },
  { type: "header", label: "Configuration" },
  { type: "item", id: "settings", label: "Settings", icon: Settings },
  { type: "item", id: "advanced", label: "Advanced", icon: Sliders },
  { type: "item", id: "vocabulary", label: "Vocabulary", icon: BookText },
  { type: "header", label: "Support" },
  { type: "item", id: "help", label: "Help", icon: HelpCircle },
];

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  appName?: string;
}

export function DashboardSidebar({ currentPage, onNavigate }: SidebarProps) {
  const [version, setVersion] = useState("");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    getCurrentVersion()
      .then(setVersion)
      .catch(() => {
        setVersion("?");
      });
  }, []);

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      const result = await checkForUpdates();
      if (result.status === "available") {
        toastSuccess(`Update ${result.info.version} available!`);
      } else if (result.status === "not-available") {
        toastSuccess("You're on the latest version");
      } else if (result.status === "error") {
        toastError(result.message);
      }
    } catch {
      toastError("Failed to check for updates");
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <aside className="flex h-full w-52 flex-col bg-canvas-soft border-r border-hairline">

      {/* Eyebrow / section label */}
      <div className="px-4 pt-2.5 pb-1 shrink-0">
        <p className="caption-strong text-body-mid-0-40" style={{ color: '#c5c0b1', fontSize: '0.5625rem', letterSpacing: '0.08em' }}>
          Workspace
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-1.5 space-y-0.5">
        {navItems.map((item, idx) => {
          if (item.type === "header") {
            return (
              <p
                key={`header-${idx}`}
                className="px-2.5 pt-3 pb-1 caption-strong text-body-muted"
                style={{ color: '#939084', fontSize: '0.5625rem', letterSpacing: '0.08em' }}
              >
                {item.label}
              </p>
            );
          }

          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn("sidebar-nav-item cursor-pointer", isActive && "active")}
            >
              <span className="nav-indicator" />
              <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
              <span className="truncate text-base">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer — minimal one-liner */}
      <div className="shrink-0 px-4 py-3 border-t border-hairline-soft">
        <div className="flex items-center gap-2 mt-2 justify-between">
          <span className="font-medium text-body-muted text-sm">
            {version ? `v${version}` : "v..."}
          </span>
          <button
            onClick={handleCheckUpdate}
            disabled={isCheckingUpdate}
            className="text-body-muted hover:text-ink transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Check for updates"
          >
            <RefreshCw className={`h-4 w-4 ${isCheckingUpdate ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </aside>
  );
}