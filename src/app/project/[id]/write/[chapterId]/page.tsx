"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  AlertTriangle,
  CheckCircle2,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProjectStore } from "@/stores/project-store";
import { useChatStore } from "@/stores/chat-store";
import { useUIStore } from "@/stores/ui-store";
import { cn, countWords, estimateTokens } from "@/lib/utils";
import TiptapEditor, { TiptapEditorRef } from "@/components/editor/tiptap-editor";
import { MentionInput, MentionItem } from "@/components/chat/mention-input";
import { toast } from "sonner";

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
  const [isCheckingContinuity, setIsCheckingContinuity] = useState(false);
  const [continuityResult, setContinuityResult] = useState<{
    issues: Array<{
      type: string;
      severity: string;
      description: string;
      location?: string;
      suggestion: string;
    }>;
    suggestions: string[];
    isConsistent: boolean;
  } | null>(null);
  const [showContinuityDialog, setShowContinuityDialog] = useState(false);
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

    try {
      // Prepare messages for the API (extract role and content only)
      const messages = [
        ...chatMessages.map(m => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: chatInput }
      ];

      // Prepare chapter context
      const chapterContext = {
        number: chapter?.chapterNumber,
        title: chapter?.title,
        summary: chapter?.summary,
        content: content,
      };

      // Get selected chapters from context (last 3 chapters)
      const selectedChapters = project?.plan?.chapters
        .filter(c => currentContext.selectedChapters?.includes(c.chapterNumber))
        .map(c => ({
          number: c.chapterNumber,
          title: c.title,
          content: c.content,
        }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          masterJson: currentContext.includeMasterJson ? project?.masterJson : null,
          chapterContext,
          selectedChapters,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addMessage(`chapter-${chapterId}`, {
          role: "assistant",
          content: data.content,
        });
      } else {
        addMessage(`chapter-${chapterId}`, {
          role: "assistant",
          content: "Грешка при комуникация с AI. Моля, опитайте отново.",
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      addMessage(`chapter-${chapterId}`, {
        role: "assistant",
        content: "Грешка при комуникация с AI. Моля, опитайте отново.",
      });
    } finally {
      setIsGenerating(false);
    }
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

  const handleCheckContinuity = async () => {
    const currentContent = editorRef.current?.getText() || content;
    if (!currentContent || currentContent.trim().length < 50) {
      toast.error("Няма достатъчно съдържание за проверка. Напишете поне няколко изречения.");
      return;
    }

    setIsCheckingContinuity(true);
    setContinuityResult(null);

    try {
      const previousChapters = project?.plan?.chapters
        .filter(c => c.chapterNumber < chapterId && c.content)
        .map(c => ({
          number: c.chapterNumber,
          title: c.title,
          content: c.content,
        }))
        .slice(-3); // Last 3 chapters for context

      const response = await fetch("/api/ai/continuity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: currentContent,
          masterJson: project?.masterJson,
          previousChapters,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setContinuityResult(data);
        setShowContinuityDialog(true);

        // Show toast notification
        if (data.isConsistent && (!data.issues || data.issues.length === 0)) {
          toast.success("Проверката завърши успешно! Няма открити проблеми с континуитета.");
        } else {
          const issueCount = data.issues?.length || 0;
          toast.warning(`Открити са ${issueCount} проблем${issueCount === 1 ? '' : 'а'} с континуитета. Вижте детайлите в диалога.`);
        }
      } else {
        toast.error("Грешка при проверката. Моля, опитайте отново.");
      }
    } catch (error) {
      console.error("Continuity check error:", error);
      toast.error("Грешка при проверката. Моля, опитайте отново.");
    } finally {
      setIsCheckingContinuity(false);
    }
  };

  // Get mention items for @ autocomplete
  const getMentionItems = useMemo((): MentionItem[] => {
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
  const contextTokens = useMemo(() => {
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

  // Memoize expensive calculations
  const wordCount = useMemo(() => countWords(content), [content]);
  const tokenCount = useMemo(() => estimateTokens(content), [content]);
  const progress = useMemo(() => {
    if (!chapter?.targetWordCount || chapter.targetWordCount === 0) return 0;
    return (wordCount / chapter.targetWordCount) * 100;
  }, [wordCount, chapter?.targetWordCount]);

  const masterJsonTokens = useMemo(() => {
    return project?.masterJson ? estimateTokens(JSON.stringify(project.masterJson)) : 0;
  }, [project?.masterJson]);

  if (!project || !chapter) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-400">Главата не е намерена</p>
      </div>
    );
  }

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

          <div className="mx-2 h-4 w-px bg-zinc-700" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCheckContinuity}
                disabled={isGenerating || isCheckingContinuity}
                className="text-amber-400 hover:text-amber-300"
              >
                {isCheckingContinuity ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <AlertTriangle className="mr-1 h-4 w-4" />
                )}
                Провери за грешки
              </Button>
            </TooltipTrigger>
            <TooltipContent>Провери за несъответствия и логически грешки</TooltipContent>
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
                ~{contextTokens.toLocaleString()} токена контекст
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
              onContinuityCheck={handleCheckContinuity}
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

      {/* Continuity Check Dialog */}
      <Dialog open={showContinuityDialog} onOpenChange={setShowContinuityDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {continuityResult?.isConsistent ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Няма открити проблеми
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Открити проблеми: {continuityResult?.issues?.length || 0}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {continuityResult && (
            <div className="space-y-4">
              {continuityResult.issues && continuityResult.issues.length > 0 && (
                <div className="space-y-3">
                  {continuityResult.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-lg border p-3",
                        issue.severity === "high"
                          ? "border-red-500/50 bg-red-500/10"
                          : issue.severity === "medium"
                          ? "border-amber-500/50 bg-amber-500/10"
                          : "border-zinc-500/50 bg-zinc-500/10"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded px-2 py-0.5 text-xs font-medium",
                              issue.severity === "high"
                                ? "bg-red-500 text-white"
                                : issue.severity === "medium"
                                ? "bg-amber-500 text-white"
                                : "bg-zinc-500 text-white"
                            )}
                          >
                            {issue.type === "character" && "Персонаж"}
                            {issue.type === "plot" && "Сюжет"}
                            {issue.type === "timeline" && "Времева линия"}
                            {issue.type === "location" && "Локация"}
                            {issue.type === "logic" && "Логика"}
                          </span>
                          <span
                            className={cn(
                              "text-xs",
                              issue.severity === "high"
                                ? "text-red-400"
                                : issue.severity === "medium"
                                ? "text-amber-400"
                                : "text-zinc-400"
                            )}
                          >
                            {issue.severity === "high" && "Висок приоритет"}
                            {issue.severity === "medium" && "Среден приоритет"}
                            {issue.severity === "low" && "Нисък приоритет"}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-zinc-200">{issue.description}</p>
                      {issue.location && (
                        <p className="mt-1 text-xs text-zinc-400 italic">
                          &quot;{issue.location}&quot;
                        </p>
                      )}
                      <p className="mt-2 text-sm text-green-400">
                        💡 {issue.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {continuityResult.suggestions && continuityResult.suggestions.length > 0 && (
                <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-3">
                  <h4 className="font-medium text-blue-400 mb-2">Общи предложения</h4>
                  <ul className="space-y-1">
                    {continuityResult.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-sm text-zinc-300">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {continuityResult.isConsistent && continuityResult.issues?.length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-2" />
                  <p className="text-zinc-300">
                    Текстът е последователен и не са открити проблеми с континуитета.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              Контекст: ~{masterJsonTokens.toLocaleString()} токена
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
              mentionItems={getMentionItems}
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
