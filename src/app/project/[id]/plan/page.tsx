"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Sparkles,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectStore } from "@/stores/project-store";
import type { Chapter, BookPlan } from "@/types";
import { generateId } from "@/lib/utils";
import Link from "next/link";

export default function PlanPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { getCurrentProject, updatePlan } = useProjectStore();
  const project = getCurrentProject();

  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapter, setNewChapter] = useState({ title: "", summary: "" });

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-400">Проектът не е намерен</p>
      </div>
    );
  }

  const toggleChapter = (chapterNumber: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterNumber)) {
      newExpanded.delete(chapterNumber);
    } else {
      newExpanded.add(chapterNumber);
    }
    setExpandedChapters(newExpanded);
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    // TODO: Integrate with Gemini API
    // For now, create a placeholder plan
    const placeholderPlan: BookPlan = {
      title: project.name,
      totalChapters: 10,
      estimatedWordCount: 80000,
      structure: "three-act",
      chapters: Array.from({ length: 10 }, (_, i) => ({
        chapterNumber: i + 1,
        title: `Глава ${i + 1}`,
        summary: "Резюме на главата...",
        keyEvents: [],
        charactersInvolved: [],
        locationsUsed: [],
        emotionalArc: "",
        plotProgressions: [],
        targetWordCount: 8000,
        actualWordCount: 0,
        status: "planned" as const,
        sections: [],
        content: "",
      })),
      acts: [
        { actNumber: 1, title: "Акт 1: Експозиция", chapters: [1, 2, 3], purpose: "Въведение" },
        { actNumber: 2, title: "Акт 2: Развитие", chapters: [4, 5, 6, 7], purpose: "Конфликт" },
        { actNumber: 3, title: "Акт 3: Развръзка", chapters: [8, 9, 10], purpose: "Разрешение" },
      ],
    };

    updatePlan(projectId, placeholderPlan);
    setIsGenerating(false);
  };

  const handleAddChapter = () => {
    if (!project.plan || !newChapter.title) return;

    const newChapterData: Chapter = {
      chapterNumber: project.plan.chapters.length + 1,
      title: newChapter.title,
      summary: newChapter.summary,
      keyEvents: [],
      charactersInvolved: [],
      locationsUsed: [],
      emotionalArc: "",
      plotProgressions: [],
      targetWordCount: 8000,
      actualWordCount: 0,
      status: "planned",
      sections: [],
      content: "",
    };

    const updatedPlan = {
      ...project.plan,
      chapters: [...project.plan.chapters, newChapterData],
      totalChapters: project.plan.totalChapters + 1,
    };

    updatePlan(projectId, updatedPlan);
    setNewChapter({ title: "", summary: "" });
    setShowAddChapter(false);
  };

  const handleDeleteChapter = (chapterNumber: number) => {
    if (!project.plan) return;

    const updatedChapters = project.plan.chapters
      .filter((c) => c.chapterNumber !== chapterNumber)
      .map((c, i) => ({ ...c, chapterNumber: i + 1 }));

    const updatedPlan = {
      ...project.plan,
      chapters: updatedChapters,
      totalChapters: updatedChapters.length,
    };

    updatePlan(projectId, updatedPlan);
  };

  const handleUpdateChapter = (chapterNumber: number, updates: Partial<Chapter>) => {
    if (!project.plan) return;

    const updatedChapters = project.plan.chapters.map((c) =>
      c.chapterNumber === chapterNumber ? { ...c, ...updates } : c
    );

    updatePlan(projectId, { ...project.plan, chapters: updatedChapters });
    setEditingChapter(null);
  };

  return (
    <div className="h-full">
      <header className="border-b border-zinc-800 bg-zinc-950/80 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">{project.name}</h1>
            <p className="text-sm text-zinc-400">
              {project.plan
                ? `${project.plan.chapters.length} глави • ${project.plan.estimatedWordCount.toLocaleString()} думи (цел)`
                : "Планът не е създаден"}
            </p>
          </div>
          <div className="flex gap-2">
            {!project.plan ? (
              <Button onClick={handleGeneratePlan} disabled={isGenerating}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? "Генериране..." : "Генерирай план"}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowAddChapter(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добави глава
                </Button>
                <Button onClick={handleGeneratePlan} disabled={isGenerating}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Регенерирай
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-6">
          {!project.plan ? (
            <Card className="mx-auto max-w-lg border-zinc-800 bg-zinc-900/50">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
                <CardTitle className="text-zinc-50">Създайте план за книгата</CardTitle>
                <CardDescription className="text-zinc-400">
                  Генерирайте план с помощта на AI или създайте ръчно
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center gap-3">
                <Button onClick={handleGeneratePlan} disabled={isGenerating}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isGenerating ? "Генериране..." : "Генерирай с AI"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddChapter(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добави ръчно
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {project.plan.acts.map((act) => (
                <div key={act.actNumber} className="space-y-2">
                  <h2 className="text-lg font-semibold text-zinc-300">
                    {act.title}
                  </h2>
                  <div className="space-y-2">
                    {project.plan?.chapters
                      .filter((c) => act.chapters.includes(c.chapterNumber))
                      .map((chapter) => (
                        <Card
                          key={chapter.chapterNumber}
                          className="border-zinc-800 bg-zinc-900/50"
                        >
                          <div
                            className="flex cursor-pointer items-center gap-3 p-4"
                            onClick={() => toggleChapter(chapter.chapterNumber)}
                          >
                            <GripVertical className="h-5 w-5 text-zinc-600" />
                            {expandedChapters.has(chapter.chapterNumber) ? (
                              <ChevronDown className="h-5 w-5 text-zinc-400" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-zinc-400" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-zinc-400">
                                  Глава {chapter.chapterNumber}:
                                </span>
                                {editingChapter === chapter.chapterNumber ? (
                                  <Input
                                    value={chapter.title}
                                    onChange={(e) =>
                                      handleUpdateChapter(chapter.chapterNumber, {
                                        title: e.target.value,
                                      })
                                    }
                                    onBlur={() => setEditingChapter(null)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") setEditingChapter(null);
                                    }}
                                    className="h-7 w-64"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <span className="font-medium text-zinc-50">
                                    {chapter.title}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-4 text-xs text-zinc-500">
                                <span>{chapter.targetWordCount.toLocaleString()} думи (цел)</span>
                                <span
                                  className={
                                    chapter.status === "complete"
                                      ? "text-green-500"
                                      : chapter.status === "in-progress"
                                      ? "text-yellow-500"
                                      : ""
                                  }
                                >
                                  {chapter.status === "planned" && "Планирана"}
                                  {chapter.status === "in-progress" && "В процес"}
                                  {chapter.status === "draft" && "Чернова"}
                                  {chapter.status === "revised" && "Ревизирана"}
                                  {chapter.status === "complete" && "Завършена"}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Link href={`/project/${projectId}/write/${chapter.chapterNumber}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-400"
                                onClick={() => handleDeleteChapter(chapter.chapterNumber)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {expandedChapters.has(chapter.chapterNumber) && (
                            <CardContent className="border-t border-zinc-800 pt-4">
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-zinc-400">Резюме</Label>
                                  <Textarea
                                    value={chapter.summary}
                                    onChange={(e) =>
                                      handleUpdateChapter(chapter.chapterNumber, {
                                        summary: e.target.value,
                                      })
                                    }
                                    className="mt-1"
                                    rows={3}
                                    placeholder="Резюме на главата..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-zinc-400">Ключови събития</Label>
                                  <Textarea
                                    value={chapter.keyEvents.join("\n")}
                                    onChange={(e) =>
                                      handleUpdateChapter(chapter.chapterNumber, {
                                        keyEvents: e.target.value.split("\n").filter(Boolean),
                                      })
                                    }
                                    className="mt-1"
                                    rows={3}
                                    placeholder="Едно събитие на ред..."
                                  />
                                </div>
                                <div className="flex justify-end">
                                  <Link href={`/project/${projectId}/write/${chapter.chapterNumber}`}>
                                    <Button>
                                      <Edit2 className="mr-2 h-4 w-4" />
                                      Пиши в тази глава
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={showAddChapter} onOpenChange={setShowAddChapter}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добави нова глава</DialogTitle>
            <DialogDescription>
              Създайте нова глава за вашия план
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Заглавие</Label>
              <Input
                value={newChapter.title}
                onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                placeholder="Заглавие на главата"
              />
            </div>
            <div className="space-y-2">
              <Label>Резюме</Label>
              <Textarea
                value={newChapter.summary}
                onChange={(e) => setNewChapter({ ...newChapter, summary: e.target.value })}
                placeholder="Кратко описание..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddChapter(false)}>
              Отказ
            </Button>
            <Button onClick={handleAddChapter} disabled={!newChapter.title}>
              Добави
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
