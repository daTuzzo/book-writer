"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Edit2, Trash2, User, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import type { Character } from "@/types";
import { generateId } from "@/lib/utils";

const emptyCharacter: Omit<Character, "id"> = {
  name: "",
  age: "",
  gender: "",
  physicalDescription: "",
  personality: [],
  background: "",
  motivations: [],
  relationships: [],
  speechPatterns: "",
  beliefs: [],
};

export default function CharactersPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { getCurrentProject, updateMasterJson } = useProjectStore();
  const project = getCurrentProject();

  const [isEditing, setIsEditing] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [formData, setFormData] = useState<Omit<Character, "id">>(emptyCharacter);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-400">Проектът не е намерен</p>
      </div>
    );
  }

  const characters = Object.values(project.masterJson.characters.permanent);

  const handleOpenNew = () => {
    setEditingCharacter(null);
    setFormData(emptyCharacter);
    setIsEditing(true);
  };

  const handleOpenEdit = (character: Character) => {
    setEditingCharacter(character);
    setFormData(character);
    setIsEditing(true);
  };

  const handleSave = () => {
    const id = editingCharacter?.id || generateId();
    const character: Character = { ...formData, id };

    const updatedCharacters = {
      ...project.masterJson.characters.permanent,
      [id]: character,
    };

    updateMasterJson(projectId, {
      characters: {
        ...project.masterJson.characters,
        permanent: updatedCharacters,
      },
    });

    setIsEditing(false);
    setEditingCharacter(null);
    setFormData(emptyCharacter);
  };

  const handleDelete = (id: string) => {
    const { [id]: _, ...remaining } = project.masterJson.characters.permanent;
    updateMasterJson(projectId, {
      characters: {
        ...project.masterJson.characters,
        permanent: remaining,
      },
    });
  };

  const handleChange = (field: keyof Omit<Character, "id">, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-950/80 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">Персонажи</h1>
            <p className="text-sm text-zinc-400">
              {characters.length} персонажа в проекта
            </p>
          </div>
          <Button onClick={handleOpenNew}>
            <Plus className="mr-2 h-4 w-4" />
            Добави персонаж
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6">
        {characters.length === 0 ? (
          <Card className="mx-auto max-w-md border-zinc-800 bg-zinc-900/50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                <User className="h-8 w-8 text-blue-500" />
              </div>
              <CardTitle className="text-zinc-50">Няма персонажи</CardTitle>
              <CardDescription className="text-zinc-400">
                Добавете персонажи, за да ги използвате в историята
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={handleOpenNew}>
                <Plus className="mr-2 h-4 w-4" />
                Добави персонаж
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {characters.map((character) => (
              <Card key={character.id} className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                        <User className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-zinc-50">
                          {character.name}
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                          {character.age && `${character.age} години`}
                          {character.age && character.gender && " • "}
                          {character.gender}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(character)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-400"
                        onClick={() => handleDelete(character.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {character.physicalDescription && (
                    <p className="text-zinc-400 line-clamp-2">
                      {character.physicalDescription}
                    </p>
                  )}
                  {character.personality.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {character.personality.slice(0, 3).map((trait, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
                        >
                          {trait}
                        </span>
                      ))}
                      {character.personality.length > 3 && (
                        <span className="text-xs text-zinc-500">
                          +{character.personality.length - 3} още
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCharacter ? "Редактирай персонаж" : "Нов персонаж"}
            </DialogTitle>
            <DialogDescription>
              Попълнете информацията за персонажа
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Име *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Име на персонажа"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Възраст</Label>
                  <Input
                    value={formData.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                    placeholder="25"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Пол</Label>
                  <Input
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    placeholder="Мъж/Жена"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Физическо описание</Label>
              <Textarea
                value={formData.physicalDescription}
                onChange={(e) => handleChange("physicalDescription", e.target.value)}
                placeholder="Външен вид, характерни черти..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Личностни черти (по една на ред)</Label>
              <Textarea
                value={formData.personality.join("\n")}
                onChange={(e) => handleChange("personality", e.target.value.split("\n").filter(Boolean))}
                placeholder="Смел&#10;Честен&#10;Упорит"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Предистория</Label>
              <Textarea
                value={formData.background}
                onChange={(e) => handleChange("background", e.target.value)}
                placeholder="История и минало на персонажа..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Мотивации (по една на ред)</Label>
              <Textarea
                value={formData.motivations.join("\n")}
                onChange={(e) => handleChange("motivations", e.target.value.split("\n").filter(Boolean))}
                placeholder="Какво движи персонажа..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Стил на говорене</Label>
              <Textarea
                value={formData.speechPatterns}
                onChange={(e) => handleChange("speechPatterns", e.target.value)}
                placeholder="Как говори персонажа, характерни фрази..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Убеждения и ценности (по една на ред)</Label>
              <Textarea
                value={formData.beliefs.join("\n")}
                onChange={(e) => handleChange("beliefs", e.target.value.split("\n").filter(Boolean))}
                placeholder="В какво вярва персонажа..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Отказ
            </Button>
            <Button onClick={handleSave} disabled={!formData.name}>
              <Save className="mr-2 h-4 w-4" />
              Запази
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
