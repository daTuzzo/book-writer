"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, forwardRef, useImperativeHandle, useState } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Plus,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface TiptapEditorRef {
  getContent: () => string;
  getHTML: () => string;
  getText: () => string;
  setContent: (content: string) => void;
  getSelectedText: () => string;
  replaceSelection: (text: string) => void;
  insertAtCursor: (text: string) => void;
  focus: () => void;
}

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSelectionChange?: (selectedText: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  onAIAction?: (action: string, selectedText: string) => void;
}

const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  (
    {
      content,
      onChange,
      onSelectionChange,
      placeholder = "Започнете да пишете тук...",
      editable = true,
      className,
      onAIAction,
    },
    ref
  ) => {
    const [selectedText, setSelectedText] = useState("");
    
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
          bulletList: {
            keepMarks: true,
            keepAttributes: false,
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false,
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: "is-editor-empty",
        }),
      ],
      content,
      editable,
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
      onSelectionUpdate: ({ editor }) => {
        const { from, to } = editor.state.selection;
        if (from !== to) {
          const text = editor.state.doc.textBetween(from, to, " ");
          setSelectedText(text);
          onSelectionChange?.(text);
        } else {
          setSelectedText("");
          onSelectionChange?.("");
        }
      },
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-invert prose-zinc max-w-none focus:outline-none min-h-[calc(100vh-300px)]",
            "prose-p:text-zinc-100 prose-p:leading-relaxed prose-p:text-lg",
            "prose-headings:text-zinc-50 prose-headings:font-semibold",
            "prose-strong:text-zinc-50 prose-em:text-zinc-200",
            "prose-blockquote:border-l-zinc-600 prose-blockquote:text-zinc-300",
            "prose-ul:text-zinc-200 prose-ol:text-zinc-200",
            "prose-li:marker:text-zinc-500",
            "[&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
            "[&_.is-editor-empty:first-child]:before:text-zinc-600",
            "[&_.is-editor-empty:first-child]:before:float-left",
            "[&_.is-editor-empty:first-child]:before:h-0",
            "[&_.is-editor-empty:first-child]:before:pointer-events-none"
          ),
        },
      },
    });

    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content);
      }
    }, [content, editor]);

    useImperativeHandle(ref, () => ({
      getContent: () => editor?.getHTML() || "",
      getHTML: () => editor?.getHTML() || "",
      getText: () => editor?.getText() || "",
      setContent: (newContent: string) => {
        editor?.commands.setContent(newContent);
      },
      getSelectedText: () => {
        if (!editor) return "";
        const { from, to } = editor.state.selection;
        return editor.state.doc.textBetween(from, to, " ");
      },
      replaceSelection: (text: string) => {
        editor?.commands.insertContent(text);
      },
      insertAtCursor: (text: string) => {
        editor?.commands.insertContent(text);
      },
      focus: () => {
        editor?.commands.focus();
      },
    }));

    const handleAIAction = (action: string) => {
      if (!editor || !onAIAction || !selectedText) return;
      onAIAction(action, selectedText);
    };

    if (!editor) {
      return (
        <div className="min-h-[calc(100vh-300px)] animate-pulse bg-zinc-900/50 rounded-lg" />
      );
    }

    return (
      <div className={cn("relative", className)}>
        {/* Editor Toolbar */}
        <div className="flex items-center gap-1 mb-4 p-2 rounded-lg border border-zinc-800 bg-zinc-900/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-zinc-700")}
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Удебелен (Ctrl+B)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn("h-8 w-8 p-0", editor.isActive("italic") && "bg-zinc-700")}
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Курсив (Ctrl+I)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={cn("h-8 w-8 p-0", editor.isActive("strike") && "bg-zinc-700")}
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Зачертан</TooltipContent>
          </Tooltip>

          <div className="mx-2 h-6 w-px bg-zinc-700" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn("h-8 w-8 p-0", editor.isActive("bulletList") && "bg-zinc-700")}
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Списък</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn("h-8 w-8 p-0", editor.isActive("orderedList") && "bg-zinc-700")}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Номериран списък</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn("h-8 w-8 p-0", editor.isActive("blockquote") && "bg-zinc-700")}
              >
                <Quote className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Цитат</TooltipContent>
          </Tooltip>

          <div className="mx-2 h-6 w-px bg-zinc-700" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 1 }) && "bg-zinc-700")}
              >
                <Heading1 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Заглавие 1</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 2 }) && "bg-zinc-700")}
              >
                <Heading2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Заглавие 2</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 3 }) && "bg-zinc-700")}
              >
                <Heading3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Заглавие 3</TooltipContent>
          </Tooltip>

          <div className="mx-2 h-6 w-px bg-zinc-700" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="h-8 w-8 p-0"
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Отмени (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="h-8 w-8 p-0"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Повтори (Ctrl+Y)</TooltipContent>
          </Tooltip>

          {/* AI Actions - shown when text is selected */}
          {selectedText && onAIAction && (
            <>
              <div className="mx-2 h-6 w-px bg-zinc-700" />
              <span className="text-xs text-zinc-500 mr-2">AI:</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIAction("shorten")}
                    className="h-8 px-2"
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    <span className="text-xs">Съкрати</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Съкрати избрания текст</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIAction("expand")}
                    className="h-8 px-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="text-xs">Разшири</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Разшири избрания текст</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIAction("rewrite")}
                    className="h-8 px-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    <span className="text-xs">Пренапиши</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Пренапиши избрания текст</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIAction("grammar")}
                    className="h-8 px-2"
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    <span className="text-xs">Граматика</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Провери граматиката</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Editor Content */}
        <EditorContent
          editor={editor}
          className="font-serif"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        />
      </div>
    );
  }
);

TiptapEditor.displayName = "TiptapEditor";

export default TiptapEditor;
