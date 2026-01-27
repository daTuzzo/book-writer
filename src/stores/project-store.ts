import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type { Project, MasterJSON, BookPlan, Chapter } from '@/types';
import { generateId } from '@/lib/utils';
import { saveProjectToIDB, loadAndMergeProjects, syncAllProjects } from '@/lib/storage/indexed-db';

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  lastSavedAt: number | null;
  isSaving: boolean;
  saveError: string | null;
  
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
  
  // Save status
  setSaving: (isSaving: boolean) => void;
  setSaveError: (error: string | null) => void;
  setLastSavedAt: (timestamp: number) => void;
  
  // Sync with IndexedDB
  syncFromIDB: () => Promise<void>;
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

// Debounce helper for save operations
let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;

async function debouncedSaveToIDB(
  project: Project, 
  setState: (partial: Partial<ProjectState>) => void
) {
  if (saveTimeoutId) {
    clearTimeout(saveTimeoutId);
  }
  
  saveTimeoutId = setTimeout(async () => {
    try {
      setState({ isSaving: true, saveError: null });
      await saveProjectToIDB(project);
      setState({ isSaving: false, lastSavedAt: Date.now() });
    } catch (error) {
      setState({ 
        isSaving: false, 
        saveError: error instanceof Error ? error.message : 'Failed to save' 
      });
    }
  }, 2000);
}

export const useProjectStore = create<ProjectState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        projects: [],
        currentProjectId: null,
        lastSavedAt: null,
        isSaving: false,
        saveError: null,

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

          // Save to IndexedDB
          debouncedSaveToIDB(newProject, set);

          return newProject;
        },

        updateProject: (id, data) => {
          set((state) => {
            const updatedProjects = state.projects.map((p) =>
              p.id === id
                ? { ...p, ...data, updatedAt: new Date().toISOString() }
                : p
            );
            
            // Find the updated project and save to IDB
            const updatedProject = updatedProjects.find(p => p.id === id);
            if (updatedProject) {
              debouncedSaveToIDB(updatedProject, set);
            }
            
            return { projects: updatedProjects };
          });
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
          set((state) => {
            const updatedProjects = state.projects.map((p) =>
              p.id === projectId
                ? {
                    ...p,
                    masterJson: { ...p.masterJson, ...masterJson },
                    updatedAt: new Date().toISOString(),
                  }
                : p
            );
            
            const updatedProject = updatedProjects.find(p => p.id === projectId);
            if (updatedProject) {
              debouncedSaveToIDB(updatedProject, set);
            }
            
            return { projects: updatedProjects };
          });
        },

        updatePlan: (projectId, plan) => {
          set((state) => {
            const updatedProjects = state.projects.map((p) =>
              p.id === projectId
                ? { ...p, plan, updatedAt: new Date().toISOString() }
                : p
            );
            
            const updatedProject = updatedProjects.find(p => p.id === projectId);
            if (updatedProject) {
              debouncedSaveToIDB(updatedProject, set);
            }
            
            return { projects: updatedProjects };
          });
        },

        updateChapter: (projectId, chapterNumber, data) => {
          set((state) => {
            const updatedProjects = state.projects.map((p) => {
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
            });
            
            const updatedProject = updatedProjects.find(p => p.id === projectId);
            if (updatedProject) {
              debouncedSaveToIDB(updatedProject, set);
            }
            
            return { projects: updatedProjects };
          });
        },
        
        setSaving: (isSaving) => set({ isSaving }),
        setSaveError: (error) => set({ saveError: error }),
        setLastSavedAt: (timestamp) => set({ lastSavedAt: timestamp }),
        
        syncFromIDB: async () => {
          try {
            const state = get();
            const mergedProjects = await loadAndMergeProjects(state.projects);
            set({ projects: mergedProjects });
            // Sync back to ensure IDB has all projects
            await syncAllProjects(mergedProjects);
          } catch (error) {
            console.error('Failed to sync from IndexedDB:', error);
          }
        },
      }),
      {
        name: 'book-writer-projects',
      }
    )
  )
);

// Initialize sync from IDB when the store is created (client-side only)
if (typeof window !== 'undefined') {
  // Delay sync to ensure IDB is available
  setTimeout(() => {
    useProjectStore.getState().syncFromIDB();
  }, 100);
}
