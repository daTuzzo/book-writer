"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Sparkles } from "lucide-react";
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

export default function NewProjectPage() {
  const router = useRouter();
  const { createProject } = useProjectStore();
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    genre: "",
    style: "",
    complexity: "moderate" as const,
    targetAudience: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const project = createProject(formData);
      router.push(`/project/${project.id}/plan`);
    } catch (error) {
      console.error("Error creating project:", error);
      setIsCreating(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
            Създайте нов проект за книга и започнете да пишете
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

              <div className="space-y-2">
                <Label>Качете файлове за контекст (опционално)</Label>
                <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-8">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-zinc-500" />
                    <p className="mt-2 text-sm text-zinc-400">
                      Плъзнете файлове тук или натиснете за качване
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      PDF, DOCX, TXT до 10MB
                    </p>
                    <Button variant="outline" size="sm" className="mt-4" type="button">
                      Изберете файлове
                    </Button>
                  </div>
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
                  disabled={!formData.name || isCreating}
                >
                  {isCreating ? "Създаване..." : "Създай проект"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
