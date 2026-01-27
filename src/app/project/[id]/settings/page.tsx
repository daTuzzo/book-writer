"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Save, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { getCurrentProject, updateProject, deleteProject, updateMasterJson } = useProjectStore();
  const { autoSaveEnabled, autoSaveInterval, setAutoSave, setAutoSaveInterval } = useUIStore();
  const project = getCurrentProject();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    genre: project?.genre || "",
    style: project?.style || "",
    targetWordCount: project?.masterJson.projectMetadata.targetWordCount || 80000,
  });

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-400">Проектът не е намерен</p>
      </div>
    );
  }

  const handleSave = () => {
    setIsSaving(true);
    updateProject(projectId, {
      name: formData.name,
      description: formData.description,
      genre: formData.genre,
      style: formData.style,
    });
    updateMasterJson(projectId, {
      projectMetadata: {
        ...project.masterJson.projectMetadata,
        title: formData.name,
        genre: formData.genre,
        style: formData.style,
        targetWordCount: formData.targetWordCount,
      },
    });
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleDelete = () => {
    deleteProject(projectId);
    router.push("/");
  };

  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-950/80 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">Настройки на проекта</h1>
            <p className="text-sm text-zinc-400">
              Редактирайте настройките на вашия проект
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Запазване..." : "Запази"}
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-zinc-50">Основна информация</CardTitle>
              <CardDescription>Основните данни за проекта</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Име на проекта</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Име на проекта"
                />
              </div>

              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Кратко описание..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Жанр</Label>
                  <Select
                    value={formData.genre}
                    onValueChange={(value) => setFormData({ ...formData, genre: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Изберете жанр" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fantasy">Фентъзи</SelectItem>
                      <SelectItem value="sci-fi">Научна фантастика</SelectItem>
                      <SelectItem value="romance">Романтика</SelectItem>
                      <SelectItem value="thriller">Трилър</SelectItem>
                      <SelectItem value="mystery">Мистерия</SelectItem>
                      <SelectItem value="horror">Ужаси</SelectItem>
                      <SelectItem value="drama">Драма</SelectItem>
                      <SelectItem value="historical">Исторически</SelectItem>
                      <SelectItem value="literary">Литературен</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Стил</Label>
                  <Select
                    value={formData.style}
                    onValueChange={(value) => setFormData({ ...formData, style: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Изберете стил" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="literary">Литературен</SelectItem>
                      <SelectItem value="commercial">Комерсиален</SelectItem>
                      <SelectItem value="poetic">Поетичен</SelectItem>
                      <SelectItem value="minimalist">Минималистичен</SelectItem>
                      <SelectItem value="descriptive">Описателен</SelectItem>
                      <SelectItem value="dialogue-heavy">Диалогов</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Целеви брой думи</Label>
                <Input
                  type="number"
                  value={formData.targetWordCount}
                  onChange={(e) => setFormData({ ...formData, targetWordCount: parseInt(e.target.value) || 0 })}
                  placeholder="80000"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-zinc-50">Автоматично запазване</CardTitle>
              <CardDescription>Настройки за автоматично запазване</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Автоматично запазване</Label>
                  <p className="text-sm text-zinc-400">
                    Автоматично запазвай промените
                  </p>
                </div>
                <Switch
                  checked={autoSaveEnabled}
                  onCheckedChange={setAutoSave}
                />
              </div>

              {autoSaveEnabled && (
                <div className="space-y-2">
                  <Label>Интервал (минути)</Label>
                  <Select
                    value={autoSaveInterval.toString()}
                    onValueChange={(value) => setAutoSaveInterval(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 минута</SelectItem>
                      <SelectItem value="5">5 минути</SelectItem>
                      <SelectItem value="10">10 минути</SelectItem>
                      <SelectItem value="15">15 минути</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-red-900/50 bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-red-400">Опасна зона</CardTitle>
              <CardDescription className="text-red-400/70">
                Внимание: тези действия са необратими
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Изтрий проекта
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Изтриване на проекта
            </DialogTitle>
            <DialogDescription>
              Сигурни ли сте, че искате да изтриете проекта &quot;{project.name}&quot;?
              Това действие е необратимо и ще загубите всички данни.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Отказ
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Изтрий
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
