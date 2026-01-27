"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface MentionItem {
  id: string;
  type: "chapter" | "character" | "location" | "plot";
  name: string;
  displayName: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onMention?: (item: MentionItem) => void;
  mentionItems: MentionItem[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MentionInput({
  value,
  onChange,
  onSubmit,
  onMention,
  mentionItems,
  placeholder = "Напишете съобщение...",
  disabled = false,
  className,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filteredItems = mentionItems.filter((item) =>
    item.displayName.toLowerCase().includes(suggestionFilter.toLowerCase())
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart;
      onChange(newValue);
      setCursorPosition(cursorPos);

      // Check for @ trigger
      const textBeforeCursor = newValue.slice(0, cursorPos);
      const atIndex = textBeforeCursor.lastIndexOf("@");

      if (atIndex !== -1) {
        const textAfterAt = textBeforeCursor.slice(atIndex + 1);
        // Only show suggestions if @ is at start or after whitespace
        const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : " ";
        if (
          (charBeforeAt === " " || charBeforeAt === "\n" || atIndex === 0) &&
          !textAfterAt.includes(" ")
        ) {
          setSuggestionFilter(textAfterAt);
          setShowSuggestions(true);
          setSelectedIndex(0);
          return;
        }
      }
      setShowSuggestions(false);
    },
    [onChange]
  );

  const insertMention = useCallback(
    (item: MentionItem) => {
      const textBeforeCursor = value.slice(0, cursorPosition);
      const atIndex = textBeforeCursor.lastIndexOf("@");
      const textAfterCursor = value.slice(cursorPosition);

      const newValue =
        value.slice(0, atIndex) + `@${item.displayName} ` + textAfterCursor;

      onChange(newValue);
      setShowSuggestions(false);
      onMention?.(item);

      // Focus back on textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    },
    [value, cursorPosition, onChange, onMention]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (showSuggestions && filteredItems.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredItems.length - 1
          );
        } else if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          insertMention(filteredItems[selectedIndex]);
        } else if (e.key === "Escape") {
          setShowSuggestions(false);
        }
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    },
    [showSuggestions, filteredItems, selectedIndex, insertMention, onSubmit]
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTypeIcon = (type: MentionItem["type"]) => {
    switch (type) {
      case "chapter":
        return "📖";
      case "character":
        return "👤";
      case "location":
        return "📍";
      case "plot":
        return "📊";
      default:
        return "•";
    }
  };

  const getTypeLabel = (type: MentionItem["type"]) => {
    switch (type) {
      case "chapter":
        return "Глава";
      case "character":
        return "Персонаж";
      case "location":
        return "Локация";
      case "plot":
        return "Сюжет";
      default:
        return "";
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[80px] resize-none pr-12"
      />

      {showSuggestions && filteredItems.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 mb-1 w-full max-h-48 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl z-50"
        >
          <div className="p-1">
            <div className="px-2 py-1 text-xs text-zinc-500 border-b border-zinc-800 mb-1">
              Изберете елемент за референция
            </div>
            {filteredItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => insertMention(item)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm",
                  index === selectedIndex
                    ? "bg-blue-500/20 text-zinc-100"
                    : "text-zinc-300 hover:bg-zinc-800"
                )}
              >
                <span>{getTypeIcon(item.type)}</span>
                <span className="flex-1 truncate">{item.displayName}</span>
                <span className="text-xs text-zinc-500">
                  {getTypeLabel(item.type)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="absolute bottom-2 right-2 text-xs text-zinc-600">
        @ за референции
      </div>
    </div>
  );
}
