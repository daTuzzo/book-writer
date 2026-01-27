"use client";

import { useParams } from "next/navigation";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SaveIndicator } from "@/components/ui/save-indicator";
import { useProjectStore } from "@/stores/project-store";
import { useEffect } from "react";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;
  const { setCurrentProject, getCurrentProject } = useProjectStore();
  const project = getCurrentProject();

  useEffect(() => {
    setCurrentProject(projectId);
    return () => setCurrentProject(null);
  }, [projectId, setCurrentProject]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar projectId={projectId} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with save indicator */}
        <header className="h-12 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
          <h1 className="text-sm font-medium text-zinc-300 truncate">
            {project?.name || "Проект"}
          </h1>
          <SaveIndicator />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
