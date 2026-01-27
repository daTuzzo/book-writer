"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Edit2, Trash2, MapPin, Save } from "lucide-react";
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
import type { Location } from "@/types";
import { generateId } from "@/lib/utils";

const emptyLocation: Omit<Location, "id"> = {
  name: "",
  type: "",
  description: "",
  geography: "",
  climate: "",
  atmosphere: "",
  significance: "",
  connectedLocations: [],
};

export default function LocationsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { getCurrentProject, updateMasterJson } = useProjectStore();
  const project = getCurrentProject();

  const [isEditing, setIsEditing] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<Omit<Location, "id">>(emptyLocation);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-400">Проектът не е намерен</p>
      </div>
    );
  }

  const locations = Object.values(project.masterJson.locations.permanent);

  const handleOpenNew = () => {
    setEditingLocation(null);
    setFormData(emptyLocation);
    setIsEditing(true);
  };

  const handleOpenEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData(location);
    setIsEditing(true);
  };

  const handleSave = () => {
    const id = editingLocation?.id || generateId();
    const location: Location = { ...formData, id };

    const updatedLocations = {
      ...project.masterJson.locations.permanent,
      [id]: location,
    };

    updateMasterJson(projectId, {
      locations: {
        ...project.masterJson.locations,
        permanent: updatedLocations,
      },
    });

    setIsEditing(false);
    setEditingLocation(null);
    setFormData(emptyLocation);
  };

  const handleDelete = (id: string) => {
    const { [id]: _, ...remaining } = project.masterJson.locations.permanent;
    updateMasterJson(projectId, {
      locations: {
        ...project.masterJson.locations,
        permanent: remaining,
      },
    });
  };

  const handleChange = (field: keyof Omit<Location, "id">, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-950/80 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">Локации</h1>
            <p className="text-sm text-zinc-400">
              {locations.length} локации в проекта
            </p>
          </div>
          <Button onClick={handleOpenNew}>
            <Plus className="mr-2 h-4 w-4" />
            Добави локация
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6">
        {locations.length === 0 ? (
          <Card className="mx-auto max-w-md border-zinc-800 bg-zinc-900/50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <MapPin className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-zinc-50">Няма локации</CardTitle>
              <CardDescription className="text-zinc-400">
                Добавете локации, за да ги използвате в историята
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={handleOpenNew}>
                <Plus className="mr-2 h-4 w-4" />
                Добави локация
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
              <Card key={location.id} className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                        <MapPin className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-zinc-50">
                          {location.name}
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                          {location.type || "Без тип"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(location)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-400"
                        onClick={() => handleDelete(location.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {location.description && (
                    <p className="text-zinc-400 line-clamp-2">
                      {location.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {location.climate && (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">
                        {location.climate}
                      </span>
                    )}
                    {location.atmosphere && (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">
                        {location.atmosphere}
                      </span>
                    )}
                  </div>
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
              {editingLocation ? "Редактирай локация" : "Нова локация"}
            </DialogTitle>
            <DialogDescription>
              Попълнете информацията за локацията
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Име *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Име на локацията"
                />
              </div>
              <div className="space-y-2">
                <Label>Тип</Label>
                <Input
                  value={formData.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                  placeholder="Град, село, гора..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Общо описание на локацията..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>География</Label>
                <Textarea
                  value={formData.geography}
                  onChange={(e) => handleChange("geography", e.target.value)}
                  placeholder="Релеф, разположение..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Климат</Label>
                <Input
                  value={formData.climate}
                  onChange={(e) => handleChange("climate", e.target.value)}
                  placeholder="Топъл, студен, умерен..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Атмосфера</Label>
              <Input
                value={formData.atmosphere}
                onChange={(e) => handleChange("atmosphere", e.target.value)}
                placeholder="Мрачна, весела, мистериозна..."
              />
            </div>

            <div className="space-y-2">
              <Label>Значение за историята</Label>
              <Textarea
                value={formData.significance}
                onChange={(e) => handleChange("significance", e.target.value)}
                placeholder="Каква роля играе локацията в сюжета..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Свързани локации (по една на ред)</Label>
              <Textarea
                value={formData.connectedLocations.join("\n")}
                onChange={(e) => handleChange("connectedLocations", e.target.value.split("\n").filter(Boolean))}
                placeholder="Близки места..."
                rows={2}
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
