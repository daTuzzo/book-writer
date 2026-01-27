"use client";

import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Save,
  Wand2,
  ArrowDown,
  ArrowUp,
  Sparkles,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  editor: Editor | null;
  selectedText?: string;
  onAIAction?: (action: string, selectedText: string) => void;
  onContinuityCheck?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  className?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  shortcut?: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  tooltip,
  shortcut,
  children,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            isActive && "bg-zinc-700 text-zinc-100"
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span>{tooltip}</span>
        {shortcut && (
          <span className="ml-2 text-zinc-400 text-xs">{shortcut}</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export function Toolbar({
  editor,
  selectedText = "",
  onAIAction,
  onContinuityCheck,
  onSave,
  isSaving = false,
  className,
}: ToolbarProps) {
  if (!editor) {
    return null;
  }

  const hasSelection = selectedText.length > 0;
  const hasContent = editor.getText().trim().length > 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 p-1.5",
        className
      )}
    >
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        tooltip="Отмяна"
        shortcut="Ctrl+Z"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        tooltip="Повтори"
        shortcut="Ctrl+Y"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-6 w-px bg-zinc-700" />

      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        tooltip="Удебелен"
        shortcut="Ctrl+B"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        tooltip="Курсив"
        shortcut="Ctrl+I"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        tooltip="Подчертан"
        shortcut="Ctrl+U"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        tooltip="Зачеркнат"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-6 w-px bg-zinc-700" />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        tooltip="Заглавие 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        tooltip="Заглавие 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        tooltip="Заглавие 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-6 w-px bg-zinc-700" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        tooltip="Списък"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        tooltip="Номериран списък"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        tooltip="Цитат"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      {/* AI Actions (only when text is selected) */}
      {onAIAction && hasSelection && (
        <>
          <div className="mx-1 h-6 w-px bg-zinc-700" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                <Wand2 className="h-4 w-4" />
                <span className="text-xs">AI</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onAIAction("shorten", selectedText)}>
                <ArrowDown className="mr-2 h-4 w-4" />
                Съкрати
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAIAction("expand", selectedText)}>
                <ArrowUp className="mr-2 h-4 w-4" />
                Разшири
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAIAction("enhance", selectedText)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Подобри
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAIAction("simplify", selectedText)}>
                Опрости
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAIAction("grammar", selectedText)}>
                Провери граматика
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      {/* Check Continuity */}
      {onContinuityCheck && hasContent && (
        <>
          <div className="mx-1 h-6 w-px bg-zinc-700" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onContinuityCheck}
                className="h-8 gap-1 px-2"
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">Провери последователност</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Провери последователност</TooltipContent>
          </Tooltip>
        </>
      )}

      {/* Save button */}
      {onSave && (
        <>
          <div className="ml-auto" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="h-8 gap-1 px-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="text-xs hidden sm:inline">Запази</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Запази (Ctrl+S)</TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
}

// Named export for backward compatibility
export { Toolbar as EditorToolbar };
