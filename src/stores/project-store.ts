import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, MasterJSON, BookPlan, Chapter } from '@/types';
import { generateId } from '@/lib/utils';

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  
  // Actions
  createProject: (data: Partial<Project>) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string | null) => void;
  getCurrentProject: () => Project | null;
  
  // MasterJSON Actions
  updateMasterJson: (projectId: string, masterJson: Partial<MasterJSON>) => void;
  
  // Plan Actions
  updatePlan: (projectId: string, plan: BookPlan) => void;
  updateChapter: (projectId: string, chapterNumber: number, data: Partial<Chapter>) => void;
}

const createEmptyMasterJson = (): MasterJSON => ({
  projectMetadata: {
    title: '',
    genre: '',
    style: '',
    targetWordCount: 80000,
    currentWordCount: 0,
  },
  characters: {
    permanent: {},
    timeline: [],
  },
  locations: {
    permanent: {},
    timeline: [],
  },
  plotElements: {
    mainPlot: { id: '', title: '', description: '', status: 'setup' },
    subplots: [],
    themes: [],
    motifs: [],
  },
  worldBuilding: {
    rules: [],
    history: [],
    culture: [],
  },
  continuityRules: [],
  styleGuide: {
    tone: '',
    pov: 'third-limited',
    tense: 'past',
    vocabulary: [],
    avoidWords: [],
    writingPatterns: [],
    analyzedStyle: null,
  },
  timeline: {
    events: [],
    currentPosition: '',
  },
});

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,

      createProject: (data) => {
        const newProject: Project = {
          id: generateId(),
          name: data.name || 'Нов проект',
          description: data.description || '',
          genre: data.genre || '',
          style: data.style || '',
          complexity: data.complexity || 'moderate',
          targetAudience: data.targetAudience || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          masterJson: createEmptyMasterJson(),
          plan: null,
        };

        set((state) => ({
          projects: [...state.projects, newProject],
          currentProjectId: newProject.id,
        }));

        return newProject;
      },

      updateProject: (id, data) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, ...data, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProjectId:
            state.currentProjectId === id ? null : state.currentProjectId,
        }));
      },

      setCurrentProject: (id) => {
        set({ currentProjectId: id });
      },

      getCurrentProject: () => {
        const state = get();
        return state.projects.find((p) => p.id === state.currentProjectId) || null;
      },

      updateMasterJson: (projectId, masterJson) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  masterJson: { ...p.masterJson, ...masterJson },
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      updatePlan: (projectId, plan) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, plan, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      updateChapter: (projectId, chapterNumber, data) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId || !p.plan) return p;
            return {
              ...p,
              plan: {
                ...p.plan,
                chapters: p.plan.chapters.map((c) =>
                  c.chapterNumber === chapterNumber ? { ...c, ...data } : c
                ),
              },
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },
    }),
    {
      name: 'book-writer-projects',
    }
  )
);
