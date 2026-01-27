"use client";

import { useState } from "react";
import { Download, FileText, FileType, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useProjectStore } from "@/stores/project-store";
import { toast } from "sonner";

const EXPORT_FORMATS = [
  {
    id: "docx",
    name: "Word документ",
    description: "Microsoft Word (.docx)",
    icon: FileType,
  },
  {
    id: "txt",
    name: "Текстов файл",
    description: "Прост текст (.txt)",
    icon: FileText,
  },
  {
    id: "md",
    name: "Markdown",
    description: "Форматиран текст (.md)",
    icon: FileText,
  },
];

interface ExportDialogProps {
  projectId?: string;
  project?: any;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function ExportDialog({ projectId, project: projectProp, trigger, children }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("docx");
  const [isExporting, setIsExporting] = useState(false);

  const { projects, currentProjectId } = useProjectStore();
  const project = projectProp || projects.find(
    (p) => p.id === (projectId || currentProjectId)
  );

  const handleExport = async () => {
    if (!project) {
      toast.error("Не е избран проект");
      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          format: selectedFormat,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Грешка при експортиране");
      }

      // Get the blob and download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${project.name}.${selectedFormat}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) {
          filename = decodeURIComponent(match[1]);
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Книгата е експортирана успешно!");
      setIsOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error(
        error instanceof Error ? error.message : "Грешка при експортиране"
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || trigger || (
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Експортирай
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Експортиране на книгата</DialogTitle>
          <DialogDescription>
            Изберете формат за сваляне на книгата
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Формат</Label>
            <div className="grid gap-2">
              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selectedFormat === format.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-zinc-700 hover:border-zinc-600"
                  }`}
                >
                  <format.icon className="h-5 w-5 text-zinc-400" />
                  <div>
                    <div className="font-medium text-zinc-100">
                      {format.name}
                    </div>
                    <div className="text-sm text-zinc-400">
                      {format.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {project && (
            <div className="rounded-lg bg-zinc-800/50 p-3">
              <div className="text-sm text-zinc-400">Проект:</div>
              <div className="font-medium text-zinc-100">{project.name}</div>
              <div className="text-sm text-zinc-400">
                {project.plan?.chapters?.length || 0} глави
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Отказ
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !project}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Експортиране...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Свали
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
