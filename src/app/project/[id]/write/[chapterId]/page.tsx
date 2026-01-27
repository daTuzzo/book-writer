"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Sparkles,
  Send,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle,
  Type,
  AlignLeft,
  Calculator,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProjectStore } from "@/stores/project-store";
import { useChatStore } from "@/stores/chat-store";
import { useUIStore } from "@/stores/ui-store";
import { cn, countWords, estimateTokens } from "@/lib/utils";
import TiptapEditor, { TiptapEditorRef } from "@/components/editor/tiptap-editor";
import { MentionInput, MentionItem } from "@/components/chat/mention-input";

export default function WritePage() {
  const params = useParams();
  const projectId = params.id as string;
  const chapterId = parseInt(params.chapterId as string);

  const { getCurrentProject, updateChapter } = useProjectStore();
  const { messages, addMessage, currentContext, setIncludeMasterJson, toggleChapter } = useChatStore();
  const { chatPanelOpen, toggleChatPanel, autoSaveEnabled } = useUIStore();

  const project = getCurrentProject();
  const chapter = project?.plan?.chapters.find((c) => c.chapterNumber === chapterId);

  const [content, setContent] = useState(chapter?.content || "");
  const [chatInput, setChatInput] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTokenCalc, setShowTokenCalc] = useState(false);
  const editorRef = useRef<TiptapEditorRef>(null);

  const chatMessages = messages[`chapter-${chapterId}`] || [];

  useEffect(() => {
    if (chapter?.content) {
      setContent(chapter.content);
    }
  }, [chapter?.content]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const text = editorRef.current?.getText() || content;
    const wordCount = countWords(text);
    updateChapter(projectId, chapterId, { 
      content: editorRef.current?.getHTML() || content, 
      actualWordCount: wordCount 
    });
    setTimeout(() => setIsSaving(false), 500);
  }, [projectId, chapterId, content, updateChapter]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const handleSelectionChange = useCallback((text: string) => {
    setSelectedText(text);
  }, []);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    addMessage(`chapter-${chapterId}`, {
      role: "user",
      content: chatInput,
    });

    setChatInput("");
    setIsGenerating(true);

    // TODO: Integrate with Gemini API
    setTimeout(() => {
      addMessage(`chapter-${chapterId}`, {
        role: "assistant",
        content: "Това е примерен отговор от AI асистента. Интеграцията с Gemini API ще бъде добавена скоро.",
      });
      setIsGenerating(false);
    }, 1000);
  };

  const handleAIAction = async (action: string, text: string) => {
    if (!text) return;
    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/ai/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text,
          context: {
            chapterTitle: chapter?.title,
            chapterSummary: chapter?.summary,
            masterJson: currentContext.includeMasterJson ? project?.masterJson : null,
          },
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.result && editorRef.current) {
          editorRef.current.replaceSelection(data.result);
        }
      }
    } catch (error) {
      console.error("AI action error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateContent = async (type: "full" | "continue" | "paragraph") => {
    if (!project || !chapter) return;
    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          chapter: {
            number: chapter.chapterNumber,
            title: chapter.title,
            summary: chapter.summary,
            keyEvents: chapter.keyEvents,
            emotionalArc: chapter.emotionalArc,
            targetWordCount: chapter.targetWordCount,
          },
          existingContent: editorRef.current?.getText() || "",
          masterJson: currentContext.includeMasterJson ? project.masterJson : null,
          previousChapters: project.plan?.chapters
            .filter(c => c.chapterNumber < chapter.chapterNumber)
            .map(c => ({ number: c.chapterNumber, title: c.title, content: c.content }))
            .slice(-3), // Last 3 chapters for context
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.content && editorRef.current) {
          if (type === "continue" || type === "paragraph") {
            editorRef.current.insertAtCursor(data.content);
          } else {
            editorRef.current.setContent(data.content);
          }
        }
      }
    } catch (error) {
      console.error("Generate content error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Get mention items for @ autocomplete
  const getMentionItems = useCallback((): MentionItem[] => {
    const items: MentionItem[] = [];
    
    // Add chapters
    if (project?.plan?.chapters) {
      project.plan.chapters.forEach((ch) => {
        items.push({
          id: `chapter-${ch.chapterNumber}`,
          type: "chapter",
          name: ch.title,
          displayName: `Глава ${ch.chapterNumber}: ${ch.title}`,
        });
      });
    }
    
    // Add characters
    if (project?.masterJson?.characters?.permanent) {
      Object.values(project.masterJson.characters.permanent).forEach((char: any) => {
        items.push({
          id: `char-${char.id}`,
          type: "character",
          name: char.name,
          displayName: char.name,
        });
      });
    }
    
    // Add locations
    if (project?.masterJson?.locations?.permanent) {
      Object.values(project.masterJson.locations.permanent).forEach((loc: any) => {
        items.push({
          id: `loc-${loc.id}`,
          type: "location",
          name: loc.name,
          displayName: loc.name,
        });
      });
    }
    
    // Add plot elements
    if (project?.masterJson?.plotElements?.mainPlot) {
      items.push({
        id: "plot-main",
        type: "plot",
        name: "Главен сюжет",
        displayName: "Главен сюжет",
      });
    }
    
    if (project?.masterJson?.plotElements?.subplots) {
      project.masterJson.plotElements.subplots.forEach((subplot: any, idx: number) => {
        items.push({
          id: `subplot-${idx}`,
          type: "plot",
          name: subplot.title || `Подсюжет ${idx + 1}`,
          displayName: subplot.title || `Подсюжет ${idx + 1}`,
        });
      });
    }
    
    return items;
  }, [project]);

  // Calculate token usage for context
  const calculateContextTokens = useCallback(() => {
    let tokens = 0;
    if (currentContext.includeMasterJson && project?.masterJson) {
      tokens += estimateTokens(JSON.stringify(project.masterJson));
    }
    if (content) {
      tokens += estimateTokens(content);
    }
    // Previous chapters context
    if (project?.plan?.chapters) {
      const prevChapters = project.plan.chapters
        .filter(c => c.chapterNumber < chapterId)
        .slice(-3);
      prevChapters.forEach(c => {
        if (c.content) tokens += estimateTokens(c.content);
      });
    }
    return tokens;
  }, [currentContext.includeMasterJson, project, content, chapterId]);

  if (!project || !chapter) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-400">Главата не е намерена</p>
      </div>
    );
  }

  const wordCount = countWords(content);
  const tokenCount = estimateTokens(content);
  const progress = chapter.targetWordCount > 0 ? (wordCount / chapter.targetWordCount) * 100 : 0;

  return (
    <div className="flex h-screen">
      {/* Main Editor Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 py-3">
          <div>
            <h1 className="text-lg font-semibold text-zinc-50">
              Глава {chapter.chapterNumber}: {chapter.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <span>{wordCount.toLocaleString()} думи</span>
              <span>~{tokenCount.toLocaleString()} токена</span>
              <span>{Math.round(progress)}% от целта</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Запази (Ctrl+S)</TooltipContent>
            </Tooltip>

            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleChatPanel()}
            >
              {chatPanelOpen ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </header>

        {/* AI Tools Toolbar */}
        <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/50 px-6 py-2">
          <span className="text-xs text-zinc-500 mr-2">AI Инструменти:</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleGenerateContent("full")}
                disabled={isGenerating}
              >
                <Sparkles className="mr-1 h-4 w-4" />
                Генерирай глава
              </Button>
            </TooltipTrigger>
            <TooltipContent>Генерирай цялата глава</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleGenerateContent("continue")}
                disabled={isGenerating}
              >
                <AlignLeft className="mr-1 h-4 w-4" />
                Продължи
              </Button>
            </TooltipTrigger>
            <TooltipContent>Продължи от текущата позиция</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleGenerateContent("paragraph")}
                disabled={isGenerating}
              >
                <Type className="mr-1 h-4 w-4" />
                Параграф
              </Button>
            </TooltipTrigger>
            <TooltipContent>Генерирай един параграф</TooltipContent>
          </Tooltip>

          {isGenerating && (
            <>
              <div className="mx-2 h-4 w-px bg-zinc-700" />
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Генериране...</span>
              </div>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTokenCalc(!showTokenCalc)}
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Калкулатор на токени</TooltipContent>
            </Tooltip>
            {showTokenCalc && (
              <span className="text-xs text-zinc-400">
                ~{calculateContextTokens().toLocaleString()} токена контекст
              </span>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-3xl">
            <TiptapEditor
              ref={editorRef}
              content={content}
              onChange={handleContentChange}
              onSelectionChange={handleSelectionChange}
              onAIAction={handleAIAction}
              placeholder="Започнете да пишете тук... или използвайте AI инструментите за генериране на съдържание."
            />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="border-t border-zinc-800 px-6 py-2">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2 rounded-full bg-zinc-800">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-zinc-500">
              {wordCount.toLocaleString()} / {chapter.targetWordCount.toLocaleString()} думи
            </span>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {chatPanelOpen && (
        <div className="flex w-96 flex-col border-l border-zinc-800 bg-zinc-950">
          {/* Chat Header */}
          <div className="border-b border-zinc-800 p-4">
            <h2 className="font-semibold text-zinc-50">Чат с AI</h2>
            <p className="text-xs text-zinc-400">
              Обсъдете идеи и получете помощ
            </p>
          </div>

          {/* Context Options */}
          <div className="border-b border-zinc-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-zinc-400">Включи MasterJSON</Label>
              <Switch
                checked={currentContext.includeMasterJson}
                onCheckedChange={setIncludeMasterJson}
              />
            </div>
            <div className="text-xs text-zinc-500">
              Контекст: ~{estimateTokens(JSON.stringify(project.masterJson)).toLocaleString()} токена
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-sm text-zinc-500">
                  <p className="mb-2">Започнете разговор с AI асистента</p>
                  <p className="text-xs">
                    Използвайте @Глава1 за референции
                  </p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "rounded-lg p-3",
                      message.role === "user"
                        ? "bg-blue-500/10 text-zinc-100"
                        : "bg-zinc-800/50 text-zinc-300"
                    )}
                  >
                    <div className="mb-1 text-xs text-zinc-500">
                      {message.role === "user" ? "Вие" : "AI Асистент"}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 text-xs"
                        onClick={() => {/* TODO: Edit functionality */}}
                      >
                        Редактирай
                      </Button>
                    )}
                  </div>
                ))
              )}
              {isGenerating && (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                  AI пише...
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="border-t border-zinc-800 p-4">
            <MentionInput
              value={chatInput}
              onChange={setChatInput}
              onSubmit={handleSendMessage}
              mentionItems={getMentionItems()}
              placeholder="Напишете съобщение... (използвайте @ за референции)"
              disabled={isGenerating}
            />
            <div className="mt-2 flex justify-between">
              <span className="text-xs text-zinc-500">
                Shift+Enter за нов ред • @ за референции
              </span>
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isGenerating}
              >
                <Send className="mr-1 h-4 w-4" />
                Изпрати
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
