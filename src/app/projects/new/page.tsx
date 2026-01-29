"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Sparkles, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectStore } from "@/stores/project-store";
import type { Chapter, Character, Location, AnalyzedStyle } from "@/types";

const GENRES = [
  { value: "fantasy", label: "Фентъзи" },
  { value: "sci-fi", label: "Научна фантастика" },
  { value: "romance", label: "Романтика" },
  { value: "thriller", label: "Трилър" },
  { value: "mystery", label: "Мистерия" },
  { value: "horror", label: "Ужаси" },
  { value: "drama", label: "Драма" },
  { value: "historical", label: "Исторически" },
  { value: "adventure", label: "Приключенски" },
  { value: "literary", label: "Литературен" },
  { value: "other", label: "Друго" },
];

const STYLES = [
  { value: "literary", label: "Литературен" },
  { value: "commercial", label: "Комерсиален" },
  { value: "poetic", label: "Поетичен" },
  { value: "minimalist", label: "Минималистичен" },
  { value: "descriptive", label: "Описателен" },
  { value: "action", label: "Динамичен" },
  { value: "dialogue-heavy", label: "Диалогов" },
];

const COMPLEXITY = [
  { value: "simple", label: "Прост" },
  { value: "moderate", label: "Умерен" },
  { value: "complex", label: "Комплексен" },
];

const AUDIENCES = [
  { value: "children", label: "Деца" },
  { value: "young-adult", label: "Млади възрастни" },
  { value: "adult", label: "Възрастни" },
  { value: "all", label: "Всички възрасти" },
];

interface ImportedData {
  chapters: Array<{
    chapterNumber: number;
    title: string;
    content: string;
    summary: string;
  }>;
  characters: Array<{
    name: string;
    description: string;
    traits: string[];
  }>;
  locations: Array<{
    name: string;
    description: string;
    type: string;
  }>;
  styleAnalysis: {
    tone: string;
    pov: "first" | "third-limited" | "third-omniscient";
    tense: "past" | "present";
    descriptionDensity: "sparse" | "moderate" | "rich";
    dialogueStyle: string;
  };
}

export default function NewProjectPage() {
  const router = useRouter();
  const { createProject, updateProject, updateMasterJson, updatePlan } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<ImportedData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importProgress, setImportProgress] = useState({ message: "", percent: 0 });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    genre: "",
    style: "",
    complexity: "moderate" as const,
    targetAudience: "",
  });

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validTypes = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith(".txt") && !file.name.endsWith(".docx") && !file.name.endsWith(".pdf")) {
      setImportError("Невалиден формат. Поддържаме PDF, DOCX и TXT файлове.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setImportError("Файлът е твърде голям. Максимум 15MB.");
      return;
    }

    setImportedFile(file);
    setImportError(null);
    setIsImporting(true);
    setImportProgress({ message: "Подготовка...", percent: 0 });

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      // Use streaming endpoint for progress updates
      const response = await fetch("/api/import/stream", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error("Грешка при импортиране");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Streaming not supported");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          const eventMatch = line.match(/event: (\w+)/);
          const dataMatch = line.match(/data: ([\s\S]+)/);

          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1];
            const data = JSON.parse(dataMatch[1]);

            if (eventType === "progress") {
              setImportProgress({ message: data.message, percent: data.percent });
            } else if (eventType === "complete") {
              setImportedData(data.analysis);
              // Auto-fill project name from first chapter or file name
              if (!formData.name) {
                const autoName = data.analysis.chapters[0]?.title || file.name.replace(/\.[^/.]+$/, "");
                setFormData(prev => ({ ...prev, name: autoName }));
              }
            } else if (eventType === "error") {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Грешка при импортиране");
      setImportedFile(null);
    } finally {
      setIsImporting(false);
      setImportProgress({ message: "", percent: 0 });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const project = createProject(formData);

      // If we have imported data, populate the project
      if (importedData) {
        // Convert imported chapters to project format
        const chapters: Chapter[] = importedData.chapters.map((ch, idx) => ({
          chapterNumber: ch.chapterNumber || idx + 1,
          title: ch.title,
          summary: ch.summary,
          keyEvents: [],
          charactersInvolved: [],
          locationsUsed: [],
          emotionalArc: "",
          plotProgressions: [],
          targetWordCount: ch.content.split(/\s+/).length,
          actualWordCount: ch.content.split(/\s+/).length,
          status: "draft" as const,
          sections: [],
          content: ch.content,
        }));

        // Convert imported characters
        const characters: Record<string, Character> = {};
        importedData.characters.forEach((char, idx) => {
          const id = `char-${idx}`;
          characters[id] = {
            id,
            name: char.name,
            age: "",
            gender: "",
            physicalDescription: char.description,
            personality: char.traits,
            background: "",
            motivations: [],
            relationships: [],
            speechPatterns: "",
            beliefs: [],
          };
        });

        // Convert imported locations
        const locations: Record<string, Location> = {};
        importedData.locations.forEach((loc, idx) => {
          const id = `loc-${idx}`;
          locations[id] = {
            id,
            name: loc.name,
            type: loc.type,
            description: loc.description,
            geography: "",
            climate: "",
            atmosphere: "",
            significance: "",
            connectedLocations: [],
          };
        });

        // Convert style analysis
        const analyzedStyle: AnalyzedStyle = {
          sentenceLength: "medium",
          paragraphLength: "medium",
          dialogueStyle: importedData.styleAnalysis.dialogueStyle,
          descriptionDensity: importedData.styleAnalysis.descriptionDensity,
          emotionalTone: importedData.styleAnalysis.tone,
          pacingStyle: "",
          samplePhrases: [],
        };

        // Update MasterJSON
        updateMasterJson(project.id, {
          projectMetadata: {
            title: formData.name,
            genre: formData.genre,
            style: formData.style,
            targetWordCount: chapters.reduce((sum, ch) => sum + ch.actualWordCount, 0),
            currentWordCount: chapters.reduce((sum, ch) => sum + ch.actualWordCount, 0),
          },
          characters: {
            permanent: characters,
            timeline: [],
          },
          locations: {
            permanent: locations,
            timeline: [],
          },
          styleGuide: {
            tone: importedData.styleAnalysis.tone,
            pov: importedData.styleAnalysis.pov,
            tense: importedData.styleAnalysis.tense,
            vocabulary: [],
            avoidWords: [],
            writingPatterns: [],
            analyzedStyle,
          },
        });

        // Update plan with chapters
        updatePlan(project.id, {
          title: formData.name,
          totalChapters: chapters.length,
          estimatedWordCount: chapters.reduce((sum, ch) => sum + ch.actualWordCount, 0),
          structure: "custom",
          chapters,
          acts: [],
        });
      }

      router.push(`/project/${project.id}/plan`);
    } catch (error) {
      console.error("Error creating project:", error);
      setIsCreating(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const clearImport = () => {
    setImportedFile(null);
    setImportedData(null);
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-50 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>Назад</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
            <Sparkles className="h-8 w-8 text-blue-500" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-zinc-50">Нов проект</h1>
          <p className="text-zinc-400">
            Създайте нов проект за книга или импортирайте съществуваща
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-zinc-50">Информация за проекта</CardTitle>
            <CardDescription className="text-zinc-400">
              Попълнете основните данни за вашия проект
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Section */}
              <div className="space-y-2">
                <Label>Импортирайте съществуваща книга (опционално)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.docx,.doc"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                
                {!importedData && !isImporting && (
                  <div
                    className={`flex items-center justify-center rounded-lg border-2 border-dashed transition-colors p-8 cursor-pointer ${
                      isDragging
                        ? "border-blue-500 bg-blue-500/10"
                        : importError
                        ? "border-red-500/50 bg-red-500/5"
                        : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-center">
                      {importError ? (
                        <>
                          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
                          <p className="mt-2 text-sm text-red-400">{importError}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Кликнете за да опитате отново
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="mx-auto h-8 w-8 text-zinc-500" />
                          <p className="mt-2 text-sm text-zinc-400">
                            Плъзнете файл тук или кликнете за качване
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            PDF, DOCX, TXT до 15MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {isImporting && (
                  <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-6">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
                      <p className="mt-3 text-sm text-blue-400">
                        {importProgress.message || "Анализиране на книгата..."}
                      </p>
                      <div className="mt-3 w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300 ease-out"
                          style={{ width: `${importProgress.percent}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">
                        {importProgress.percent > 0 ? `${importProgress.percent}%` : "Подготовка..."}
                      </p>
                    </div>
                  </div>
                )}

                {importedData && (
                  <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-400">
                          Книгата е импортирана успешно!
                        </p>
                        <div className="mt-2 text-xs text-zinc-400 space-y-1">
                          <p>📚 {importedData.chapters.length} глави</p>
                          <p>👤 {importedData.characters.length} персонажа</p>
                          <p>📍 {importedData.locations.length} локации</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-xs text-zinc-500 hover:text-zinc-300"
                          onClick={clearImport}
                        >
                          Премахни импорта
                        </Button>
                      </div>
                      <FileText className="h-5 w-5 text-zinc-500" />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Име на проекта *</Label>
                <Input
                  id="name"
                  placeholder="Напр. Последното пътуване"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  placeholder="Кратко описание на историята..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Жанр</Label>
                  <Select
                    value={formData.genre}
                    onValueChange={(value) => handleChange("genre", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Изберете жанр" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((genre) => (
                        <SelectItem key={genre.value} value={genre.value}>
                          {genre.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Стил на писане</Label>
                  <Select
                    value={formData.style}
                    onValueChange={(value) => handleChange("style", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Изберете стил" />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Сложност</Label>
                  <Select
                    value={formData.complexity}
                    onValueChange={(value) => handleChange("complexity", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Изберете сложност" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPLEXITY.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Целева аудитория</Label>
                  <Select
                    value={formData.targetAudience}
                    onValueChange={(value) => handleChange("targetAudience", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Изберете аудитория" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIENCES.map((audience) => (
                        <SelectItem key={audience.value} value={audience.value}>
                          {audience.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full" type="button">
                    Отказ
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!formData.name || isCreating || isImporting}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Създаване...
                    </>
                  ) : importedData ? (
                    "Създай от импорт"
                  ) : (
                    "Създай проект"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
