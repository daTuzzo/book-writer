"use client";

import Link from "next/link";
import { BookOpen, Plus, FolderOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectStore } from "@/stores/project-store";
import { formatDate } from "@/lib/utils";

export default function Home() {
  const { projects } = useProjectStore();

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-zinc-50" />
            <span className="text-xl font-bold text-zinc-50">Писател</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/projects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Нов проект
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            Добре дошли в <span className="text-blue-500">Писател</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            AI помощник за писане на книги, разкази и новели. 
            Използвайте силата на Gemini 3 за да създадете вашето следващо произведение.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="mx-auto max-w-md">
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                  <Sparkles className="h-8 w-8 text-blue-500" />
                </div>
                <CardTitle className="text-zinc-50">Започнете нов проект</CardTitle>
                <CardDescription className="text-zinc-400">
                  Създайте първия си проект и започнете да пишете с помощта на AI
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Link href="/projects/new">
                  <Button size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Създай проект
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-zinc-50">Вашите проекти</h2>
              <Link href="/projects/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Нов проект
                </Button>
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link key={project.id} href={`/project/${project.id}/plan`}>
                  <Card className="border-zinc-800 bg-zinc-900/50 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                          <FolderOpen className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg text-zinc-50">
                            {project.name}
                          </CardTitle>
                          <CardDescription className="text-zinc-400">
                            {project.genre || "Без жанр"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3 line-clamp-2 text-sm text-zinc-400">
                        {project.description || "Без описание"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>
                          {project.plan
                            ? `${project.plan.chapters.length} глави`
                            : "Без план"}
                        </span>
                        <span>{formatDate(project.updatedAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
