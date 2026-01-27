"use client";

import { useParams } from "next/navigation";
import { Sidebar } from "@/components/sidebar/sidebar";
import { useProjectStore } from "@/stores/project-store";
import { useEffect } from "react";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;
  const { setCurrentProject } = useProjectStore();

  useEffect(() => {
    setCurrentProject(projectId);
    return () => setCurrentProject(null);
  }, [projectId, setCurrentProject]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar projectId={projectId} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
