"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FileText,
  Users,
  MapPin,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Plus,
  FolderOpen,
  Database,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import { ExportDialog } from "@/components/export-dialog";

interface SidebarProps {
  projectId?: string;
}

export function Sidebar({ projectId }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { projects, getCurrentProject } = useProjectStore();
  const currentProject = getCurrentProject();

  const projectNavItems = projectId
    ? [
        {
          title: "План",
          href: `/project/${projectId}/plan`,
          icon: FileText,
        },
        {
          title: "MasterJSON",
          href: `/project/${projectId}/master-json`,
          icon: Database,
        },
        {
          title: "Персонажи",
          href: `/project/${projectId}/characters`,
          icon: Users,
        },
        {
          title: "Локации",
          href: `/project/${projectId}/locations`,
          icon: MapPin,
        },
        {
          title: "Настройки",
          href: `/project/${projectId}/settings`,
          icon: Settings,
        },
      ]
    : [];

  if (!sidebarOpen) {
    return (
      <div className="flex h-full w-12 flex-col items-center border-r border-zinc-200 bg-zinc-50 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <PanelLeft className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-zinc-900 dark:text-zinc-50" />
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            Писател
          </span>
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <PanelLeftClose className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                Проекти
              </h3>
              <Link href="/projects/new">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <nav className="space-y-1">
              {projects.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Няма проекти
                </p>
              ) : (
                projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/project/${project.id}/plan`}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      pathname?.includes(project.id)
                        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    )}
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span className="truncate">{project.name}</span>
                  </Link>
                ))
              )}
            </nav>
          </div>

          {projectId && currentProject && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                {currentProject.name}
              </h3>
              <nav className="space-y-1">
                {projectNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      pathname === item.href
                        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                ))}
              </nav>

              {currentProject.plan && (
                <div className="mt-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                    Глави
                  </h4>
                  <nav className="space-y-1">
                    {currentProject.plan.chapters.map((chapter) => (
                      <Link
                        key={chapter.chapterNumber}
                        href={`/project/${projectId}/write/${chapter.chapterNumber}`}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                          pathname?.includes(`/write/${chapter.chapterNumber}`)
                            ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        )}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="truncate">
                          Гл. {chapter.chapterNumber}: {chapter.title}
                        </span>
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              {/* Export Button */}
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <ExportDialog project={currentProject}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Download className="h-4 w-4" />
                    Експортирай
                  </Button>
                </ExportDialog>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <Link href="/settings">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Settings className="h-4 w-4" />
            Настройки
          </Button>
        </Link>
      </div>
    </div>
  );
}
