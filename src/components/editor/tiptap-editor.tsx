"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import UnderlineExtension from "@tiptap/extension-underline";
import { useEffect, forwardRef, useImperativeHandle, useState, useCallback, memo } from "react";
import { cn, countWords, estimateTokens } from "@/lib/utils";
import { Toolbar } from "./toolbar";

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
  onSave?: () => void;
  isSaving?: boolean;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  onAIAction?: (action: string, selectedText: string) => void;
  onContinuityCheck?: () => void;
}

const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  (
    {
      content,
      onChange,
      onSelectionChange,
      onSave,
      isSaving = false,
      placeholder = "Започнете да пишете тук...",
      editable = true,
      className,
      onAIAction,
      onContinuityCheck,
    },
    ref
  ) => {
    const [selectedText, setSelectedText] = useState("");
    const [wordCount, setWordCount] = useState(0);
    const [tokenCount, setTokenCount] = useState(0);

    // Handle Ctrl+S for save
    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "s") {
          event.preventDefault();
          onSave?.();
        }
      },
      [onSave]
    );

    useEffect(() => {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

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
        UnderlineExtension,
        Placeholder.configure({
          placeholder,
          emptyEditorClass: "is-editor-empty",
        }),
      ],
      content,
      editable,
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        onChange(html);
        const text = editor.getText();
        setWordCount(countWords(text));
        setTokenCount(estimateTokens(text));
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
        const text = editor.getText();
        setWordCount(countWords(text));
        setTokenCount(estimateTokens(text));
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

    if (!editor) {
      return (
        <div className="min-h-[calc(100vh-300px)] animate-pulse bg-zinc-900/50 rounded-lg" />
      );
    }

    return (
      <div className={cn("relative", className)}>
        {/* Editor Toolbar */}
        <Toolbar
          editor={editor}
          selectedText={selectedText}
          onAIAction={onAIAction}
          onContinuityCheck={onContinuityCheck}
          onSave={onSave}
          isSaving={isSaving}
          className="mb-4"
        />

        {/* Editor Content */}
        <EditorContent
          editor={editor}
          className="font-serif"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        />

        {/* Word Count Display */}
        <div className="text-xs text-zinc-500 mt-4">
          {wordCount} думи • ~{tokenCount} токена
        </div>
      </div>
    );
  }
);

TiptapEditor.displayName = "TiptapEditor";

export default memo(TiptapEditor);
