"use client";

import { Cloud, CloudOff, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useProjectStore } from "@/stores/project-store";

type SaveStatus = "saved" | "saving" | "offline" | "error";

export function SaveIndicator() {
  const { lastSavedAt, isSaving, saveError } = useProjectStore();
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check online status
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setStatus("offline");
    } else if (saveError) {
      setStatus("error");
    } else if (isSaving) {
      setStatus("saving");
    } else {
      setStatus("saved");
    }
  }, [isOnline, isSaving, saveError]);

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;

    if (diff < 60000) {
      return "преди момент";
    } else if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `преди ${mins} мин`;
    } else if (date.toDateString() === now.toDateString()) {
      return `днес в ${date.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString("bg-BG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    }
  };

  const statusConfig = {
    saved: {
      icon: Check,
      text: "Запазено",
      className: "text-green-500",
    },
    saving: {
      icon: Loader2,
      text: "Запазване...",
      className: "text-blue-500",
    },
    offline: {
      icon: CloudOff,
      text: "Офлайн",
      className: "text-yellow-500",
    },
    error: {
      icon: Cloud,
      text: "Грешка при запазване",
      className: "text-red-500",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon
        className={`h-4 w-4 ${config.className} ${status === "saving" ? "animate-spin" : ""}`}
      />
      <span className={config.className}>{config.text}</span>
      {lastSavedAt && status === "saved" && (
        <span className="text-zinc-500 text-xs">
          ({formatTimestamp(lastSavedAt)})
        </span>
      )}
    </div>
  );
}
