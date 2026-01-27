"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Save, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectStore } from "@/stores/project-store";

export default function MasterJsonPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { getCurrentProject, updateMasterJson } = useProjectStore();
  const project = getCurrentProject();

  const [jsonString, setJsonString] = useState(
    project ? JSON.stringify(project.masterJson, null, 2) : "{}"
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-400">Проектът не е намерен</p>
      </div>
    );
  }

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonString);
      setError(null);
      setIsSaving(true);
      updateMasterJson(projectId, parsed);
      setTimeout(() => setIsSaving(false), 500);
    } catch (e) {
      setError("Невалиден JSON формат");
    }
  };

  const handleReset = () => {
    setJsonString(JSON.stringify(project.masterJson, null, 2));
    setError(null);
  };

  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-950/80 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">MasterJSON</h1>
            <p className="text-sm text-zinc-400">
              Библията на проекта - всички персонажи, локации и правила
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Възстанови
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Запазване..." : "Запази"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <Tabs defaultValue="visual" className="h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="visual">Визуален изглед</TabsTrigger>
            <TabsTrigger value="json">JSON Редактор</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="flex-1">
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader>
                    <CardTitle className="text-zinc-50">Метаданни</CardTitle>
                    <CardDescription>Основна информация за проекта</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Заглавие:</span>
                      <span className="text-zinc-50">{project.masterJson.projectMetadata.title || project.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Жанр:</span>
                      <span className="text-zinc-50">{project.masterJson.projectMetadata.genre || project.genre || "Не е зададен"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Стил:</span>
                      <span className="text-zinc-50">{project.masterJson.projectMetadata.style || project.style || "Не е зададен"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Целеви думи:</span>
                      <span className="text-zinc-50">{project.masterJson.projectMetadata.targetWordCount.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader>
                    <CardTitle className="text-zinc-50">Стилов указател</CardTitle>
                    <CardDescription>Правила за стила на писане</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Тон:</span>
                      <span className="text-zinc-50">{project.masterJson.styleGuide.tone || "Не е зададен"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">POV:</span>
                      <span className="text-zinc-50">{project.masterJson.styleGuide.pov}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Време:</span>
                      <span className="text-zinc-50">{project.masterJson.styleGuide.tense === "past" ? "Минало" : "Сегашно"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader>
                    <CardTitle className="text-zinc-50">Персонажи</CardTitle>
                    <CardDescription>
                      {Object.keys(project.masterJson.characters.permanent).length} персонажа
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(project.masterJson.characters.permanent).length === 0 ? (
                      <p className="text-sm text-zinc-500">Няма добавени персонажи</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {Object.values(project.masterJson.characters.permanent).map((char) => (
                          <li key={char.id} className="text-zinc-300">
                            {char.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader>
                    <CardTitle className="text-zinc-50">Локации</CardTitle>
                    <CardDescription>
                      {Object.keys(project.masterJson.locations.permanent).length} локации
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(project.masterJson.locations.permanent).length === 0 ? (
                      <p className="text-sm text-zinc-500">Няма добавени локации</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {Object.values(project.masterJson.locations.permanent).map((loc) => (
                          <li key={loc.id} className="text-zinc-300">
                            {loc.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900/50 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-zinc-50">Правила за непрекъснатост</CardTitle>
                    <CardDescription>
                      {project.masterJson.continuityRules.length} правила
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {project.masterJson.continuityRules.length === 0 ? (
                      <p className="text-sm text-zinc-500">Няма добавени правила</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {project.masterJson.continuityRules.map((rule) => (
                          <li key={rule.id} className="flex items-start gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              rule.importance === "critical" ? "bg-red-500/20 text-red-400" :
                              rule.importance === "important" ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-zinc-500/20 text-zinc-400"
                            }`}>
                              {rule.importance === "critical" ? "Критично" :
                               rule.importance === "important" ? "Важно" : "Второстепенно"}
                            </span>
                            <span className="text-zinc-300">{rule.rule}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="json" className="flex-1">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-400">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}
            <Textarea
              value={jsonString}
              onChange={(e) => setJsonString(e.target.value)}
              className="h-[calc(100vh-300px)] font-mono text-sm"
              placeholder="JSON данни..."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
