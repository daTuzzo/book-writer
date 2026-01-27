import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjectStore } from '@/stores/project-store';
import type { Project, BookPlan, Chapter } from '@/types';

// Mock the IndexedDB storage functions
vi.mock('@/lib/storage/indexed-db', () => ({
  saveProjectToIDB: vi.fn(() => Promise.resolve()),
  loadAndMergeProjects: vi.fn((projects) => Promise.resolve(projects)),
  syncAllProjects: vi.fn(() => Promise.resolve()),
}));

// Mock generateId to return predictable IDs for testing
vi.mock('@/lib/utils', () => ({
  generateId: vi.fn(() => 'test-id-' + Math.random().toString(36).substring(7)),
}));

describe('ProjectStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    const { result } = renderHook(() => useProjectStore());
    act(() => {
      result.current.projects.forEach((project) => {
        result.current.deleteProject(project.id);
      });
      result.current.setCurrentProject(null);
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('createProject', () => {
    it('creates project with correct defaults when no data provided', () => {
      const { result } = renderHook(() => useProjectStore());

      let newProject: Project;
      act(() => {
        newProject = result.current.createProject({});
      });

      expect(newProject!).toMatchObject({
        name: 'Нов проект',
        description: '',
        genre: '',
        style: '',
        complexity: 'moderate',
        targetAudience: '',
      });
      expect(newProject!.id).toBeDefined();
      expect(newProject!.createdAt).toBeDefined();
      expect(newProject!.updatedAt).toBeDefined();
      expect(newProject!.masterJson).toBeDefined();
      expect(newProject!.plan).toBeNull();
    });

    it('creates project with provided data', () => {
      const { result } = renderHook(() => useProjectStore());

      let newProject: Project;
      act(() => {
        newProject = result.current.createProject({
          name: 'Test Project',
          description: 'A test description',
          genre: 'Fantasy',
          style: 'Epic',
          complexity: 'complex',
          targetAudience: 'Young Adults',
        });
      });

      expect(newProject!).toMatchObject({
        name: 'Test Project',
        description: 'A test description',
        genre: 'Fantasy',
        style: 'Epic',
        complexity: 'complex',
        targetAudience: 'Young Adults',
      });
    });

    it('creates project with empty MasterJSON structure', () => {
      const { result } = renderHook(() => useProjectStore());

      let newProject: Project;
      act(() => {
        newProject = result.current.createProject({ name: 'Test' });
      });

      expect(newProject!.masterJson).toMatchObject({
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
    });

    it('adds project to store and sets as current', () => {
      const { result } = renderHook(() => useProjectStore());

      let newProject: Project;
      act(() => {
        newProject = result.current.createProject({ name: 'Test' });
      });

      expect(result.current.projects).toHaveLength(1);
      expect(result.current.projects[0].id).toBe(newProject!.id);
      expect(result.current.currentProjectId).toBe(newProject!.id);
    });

    it('creates multiple projects independently', () => {
      const { result } = renderHook(() => useProjectStore());

      let project1: Project, project2: Project;
      act(() => {
        project1 = result.current.createProject({ name: 'Project 1' });
        project2 = result.current.createProject({ name: 'Project 2' });
      });

      expect(result.current.projects).toHaveLength(2);
      expect(project1.id).not.toBe(project2.id);
      expect(result.current.currentProjectId).toBe(project2.id);
    });
  });

  describe('updateProject', () => {
    it('updates project correctly', () => {
      const { result } = renderHook(() => useProjectStore());

      let project: Project;
      act(() => {
        project = result.current.createProject({ name: 'Original Name' });
      });

      const originalUpdatedAt = project.updatedAt;

      // Wait a bit to ensure updatedAt changes
      vi.useFakeTimers();
      vi.advanceTimersByTime(10);

      act(() => {
        result.current.updateProject(project.id, {
          name: 'Updated Name',
          description: 'Updated Description',
        });
      });

      vi.useRealTimers();

      const updatedProject = result.current.projects.find(p => p.id === project.id);
      expect(updatedProject).toMatchObject({
        name: 'Updated Name',
        description: 'Updated Description',
      });
      expect(updatedProject!.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('only updates specified fields', () => {
      const { result } = renderHook(() => useProjectStore());

      let project: Project;
      act(() => {
        project = result.current.createProject({
          name: 'Test Project',
          genre: 'Fantasy',
          style: 'Epic',
        });
      });

      act(() => {
        result.current.updateProject(project.id, { name: 'Updated Name' });
      });

      const updatedProject = result.current.projects.find(p => p.id === project.id);
      expect(updatedProject).toMatchObject({
        name: 'Updated Name',
        genre: 'Fantasy',
        style: 'Epic',
      });
    });

    it('does not affect other projects', () => {
      const { result } = renderHook(() => useProjectStore());

      let project1: Project, project2: Project;
      act(() => {
        project1 = result.current.createProject({ name: 'Project 1' });
        project2 = result.current.createProject({ name: 'Project 2' });
      });

      act(() => {
        result.current.updateProject(project1.id, { name: 'Updated Project 1' });
      });

      const updatedProject1 = result.current.projects.find(p => p.id === project1.id);
      const unchangedProject2 = result.current.projects.find(p => p.id === project2.id);

      expect(updatedProject1!.name).toBe('Updated Project 1');
      expect(unchangedProject2!.name).toBe('Project 2');
    });

    it('handles non-existent project gracefully', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.createProject({ name: 'Test' });
      });

      const projectsCount = result.current.projects.length;

      act(() => {
        result.current.updateProject('non-existent-id', { name: 'Updated' });
      });

      expect(result.current.projects.length).toBe(projectsCount);
      expect(result.current.projects.find(p => p.name === 'Updated')).toBeUndefined();
    });
  });

  describe('deleteProject', () => {
    it('removes project from store', () => {
      const { result } = renderHook(() => useProjectStore());

      let project: Project;
      act(() => {
        project = result.current.createProject({ name: 'Test' });
      });

      expect(result.current.projects).toHaveLength(1);

      act(() => {
        result.current.deleteProject(project.id);
      });

      expect(result.current.projects).toHaveLength(0);
    });

    it('clears currentProjectId when deleting current project', () => {
      const { result } = renderHook(() => useProjectStore());

      let project: Project;
      act(() => {
        project = result.current.createProject({ name: 'Test' });
      });

      expect(result.current.currentProjectId).toBe(project.id);

      act(() => {
        result.current.deleteProject(project.id);
      });

      expect(result.current.currentProjectId).toBeNull();
    });

    it('keeps currentProjectId when deleting different project', () => {
      const { result } = renderHook(() => useProjectStore());

      let project1: Project, project2: Project;
      act(() => {
        project1 = result.current.createProject({ name: 'Project 1' });
        project2 = result.current.createProject({ name: 'Project 2' });
      });

      expect(result.current.currentProjectId).toBe(project2.id);

      act(() => {
        result.current.deleteProject(project1.id);
      });

      expect(result.current.currentProjectId).toBe(project2.id);
      expect(result.current.projects).toHaveLength(1);
    });

    it('handles deleting non-existent project gracefully', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.createProject({ name: 'Test' });
      });

      const projectsCount = result.current.projects.length;

      act(() => {
        result.current.deleteProject('non-existent-id');
      });

      expect(result.current.projects.length).toBe(projectsCount);
    });
  });

  describe('updateMasterJson', () => {
    it('merges MasterJSON correctly with shallow merge', () => {
      const { result } = renderHook(() => useProjectStore());

      let project: Project;
      act(() => {
        project = result.current.createProject({ name: 'Test' });
      });

      act(() => {
        result.current.updateMasterJson(project.id, {
          projectMetadata: {
            title: 'My Book',
            genre: 'Fantasy',
            style: 'Epic',
            targetWordCount: 100000,
            currentWordCount: 5000,
          },
        });
      });

      const updatedProject = result.current.projects.find(p => p.id === project.id);
      expect(updatedProject!.masterJson.projectMetadata).toEqual({
        title: 'My Book',
        genre: 'Fantasy',
        style: 'Epic',
        targetWordCount: 100000,
        currentWordCount: 5000,
      });
    });

    it('preserves other MasterJSON fields when updating one field', () => {
      const { result } = renderHook(() => useProjectStore());

      let project: Project;
      act(() => {
        project = result.current.createProject({ name: 'Test' });
      });

      // Update projectMetadata
      act(() => {
        result.current.updateMasterJson(project.id, {
          projectMetadata: {
            title: 'My Book',
            genre: 'Fantasy',
            style: 'Epic',
            targetWordCount: 100000,
            currentWordCount: 5000,
          },
        });
      });

      // Update continuityRules
      act(() => {
        result.current.updateMasterJson(project.id, {
          continuityRules: [
            {
              id: 'rule-1',
              rule: 'Magic has limits',
              category: 'world',
              importance: 'critical',
            },
          ],
        });
      });

      const updatedProject = result.current.projects.find(p => p.id === project.id);

      // Both updates should be present
      expect(updatedProject!.masterJson.projectMetadata.title).toBe('My Book');
      expect(updatedProject!.masterJson.continuityRules).toHaveLength(1);
      expect(updatedProject!.masterJson.continuityRules[0].rule).toBe('Magic has limits');
    });

    it('updates complex nested structures', () => {
      const { result } = renderHook(() => useProjectStore());

      let project: Project;
      act(() => {
        project = result.current.createProject({ name: 'Test' });
      });

      act(() => {
        result.current.updateMasterJson(project.id, {
          characters: {
            permanent: {
              'char-1': {
                id: 'char-1',
                name: 'John Doe',
                age: '30',
                gender: 'male',
                physicalDescription: 'Tall and strong',
                personality: ['brave', 'loyal'],
                background: 'Warrior',
                motivations: ['protect family'],
                relationships: [],
                speechPatterns: 'Direct',
                beliefs: ['honor'],
              },
            },
            timeline: [],
          },
        });
      });

      const updatedProject = result.current.projects.find(p => p.id === project.id);
      expect(updatedProject!.masterJson.characters.permanent['char-1']).toBeDefined();
      expect(updatedProject!.masterJson.characters.permanent['char-1'].name).toBe('John Doe');
    });

    it('updates updatedAt timestamp', () => {
      const { result } = renderHook(() => useProjectStore());

      let project: Project;
      act(() => {
        project = result.current.createProject({ name: 'Test' });
      });

      const originalUpdatedAt = project.updatedAt;

      vi.useFakeTimers();
      vi.advanceTimersByTime(10);

      act(() => {
        result.current.updateMasterJson(project.id, {
          projectMetadata: {
            title: 'Updated',
            genre: '',
            style: '',
            targetWordCount: 80000,
            currentWordCount: 0,
          },
        });
      });

      vi.useRealTimers();

      const updatedProject = result.current.projects.find(p => p.id === project.id);
      expect(updatedProject!.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('handles non-existent project gracefully', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.createProject({ name: 'Test' });
      });

      act(() => {
        result.current.updateMasterJson('non-existent-id', {
          projectMetadata: {
            title: 'Test',
            genre: '',
            style: '',
            targetWordCount: 80000,
            currentWordCount: 0,
          },
        });
      });

      // Should not throw or cause errors
      expect(result.current.projects).toHaveLength(1);
    });
  });

  describe('getCurrentProject', () => {
    it('returns current project when one is set', () => {
      const { result } = renderHook(() => useProjectStore());

      let project: Project;
      act(() => {
        project = result.current.createProject({ name: 'Test' });
      });

      const currentProject = result.current.getCurrentProject();
      expect(currentProject).toBeDefined();
      expect(currentProject!.id).toBe(project.id);
    });

    it('returns null when no current project', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.createProject({ name: 'Test' });
        result.current.setCurrentProject(null);
      });

      const currentProject = result.current.getCurrentProject();
      expect(currentProject).toBeNull();
    });

    it('returns null when currentProjectId points to non-existent project', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.setCurrentProject('non-existent-id');
      });

      const currentProject = result.current.getCurrentProject();
      expect(currentProject).toBeNull();
    });
  });

  describe('setCurrentProject', () => {
    it('sets current project by id', () => {
      const { result } = renderHook(() => useProjectStore());

      let project1: Project, project2: Project;
      act(() => {
        project1 = result.current.createProject({ name: 'Project 1' });
        project2 = result.current.createProject({ name: 'Project 2' });
      });

      expect(result.current.currentProjectId).toBe(project2.id);

      act(() => {
        result.current.setCurrentProject(project1.id);
      });

      expect(result.current.currentProjectId).toBe(project1.id);
    });

    it('clears current project when passed null', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.createProject({ name: 'Test' });
      });

      expect(result.current.currentProjectId).not.toBeNull();

      act(() => {
        result.current.setCurrentProject(null);
      });

      expect(result.current.currentProjectId).toBeNull();
    });
  });

  describe('updatePlan', () => {
    it('updates project plan', () => {
      const { result } = renderHook(() => useProjectStore());

      let project: Project;
      act(() => {
        project = result.current.createProject({ name: 'Test' });
      });

      const plan: BookPlan = {
        title: 'My Book',
        totalChapters: 10,
        estimatedWordCount: 80000,
        structure: 'three-act',
        chapters: [],
        acts: [],
      };

      act(() => {
        result.current.updatePlan(project.id, plan);
      });

      const updatedProject = result.current.projects.find(p => p.id === project.id);
      expect(updatedProject!.plan).toEqual(plan);
    });

    it('replaces existing plan', () => {
      const { result } = renderHook(() => useProjectStore());

      let project: Project;
      act(() => {
        project = result.current.createProject({ name: 'Test' });
      });

      const plan1: BookPlan = {
        title: 'Plan 1',
        totalChapters: 5,
        estimatedWordCount: 40000,
        structure: 'three-act',
        chapters: [],
        acts: [],
      };

      const plan2: BookPlan = {
        title: 'Plan 2',
        totalChapters: 10,
        estimatedWordCount: 80000,
        structure: 'five-act',
        chapters: [],
        acts: [],
      };

      act(() => {
        result.current.updatePlan(project.id, plan1);
      });

      act(() => {
        result.current.updatePlan(project.id, plan2);
      });

      const updatedProject = result.current.projects.find(p => p.id === project.id);
      expect(updatedProject!.plan).toEqual(plan2);
    });
  });

  describe('updateChapter', () => {
    it('updates chapter in project plan', () => {
      const { result } = renderHook(() => useProjectStore());

      let project: Project;
      act(() => {
        project = result.current.createProject({ name: 'Test' });
      });

      const chapter: Chapter = {
        chapterNumber: 1,
        title: 'Chapter 1',
        summary: 'First chapter',
        keyEvents: [],
        charactersInvolved: [],
        locationsUsed: [],
        emotionalArc: 'rising',
        plotProgressions: [],
        targetWordCount: 3000,
        actualWordCount: 0,
        status: 'planned',
        sections: [],
        content: '',
      };

      const plan: BookPlan = {
        title: 'My Book',
        totalChapters: 3,
        estimatedWordCount: 9000,
        structure: 'three-act',
        chapters: [chapter],
        acts: [],
      };

      act(() => {
        result.current.updatePlan(project.id, plan);
      });

      act(() => {
        result.current.updateChapter(project.id, 1, {
          title: 'Updated Chapter 1',
          content: 'Some content',
          actualWordCount: 500,
        });
      });

      const updatedProject = result.current.projects.find(p => p.id === project.id);
      const updatedChapter = updatedProject!.plan!.chapters[0];

      expect(updatedChapter.title).toBe('Updated Chapter 1');
      expect(updatedChapter.content).toBe('Some content');
      expect(updatedChapter.actualWordCount).toBe(500);
      expect(updatedChapter.summary).toBe('First chapter'); // Unchanged field
    });

    it('only updates specified chapter', () => {
      const { result } = renderHook(() => useProjectStore());

      let project: Project;
      act(() => {
        project = result.current.createProject({ name: 'Test' });
      });

      const chapters: Chapter[] = [
        {
          chapterNumber: 1,
          title: 'Chapter 1',
          summary: '',
          keyEvents: [],
          charactersInvolved: [],
          locationsUsed: [],
          emotionalArc: '',
          plotProgressions: [],
          targetWordCount: 3000,
          actualWordCount: 0,
          status: 'planned',
          sections: [],
          content: '',
        },
        {
          chapterNumber: 2,
          title: 'Chapter 2',
          summary: '',
          keyEvents: [],
          charactersInvolved: [],
          locationsUsed: [],
          emotionalArc: '',
          plotProgressions: [],
          targetWordCount: 3000,
          actualWordCount: 0,
          status: 'planned',
          sections: [],
          content: '',
        },
      ];

      const plan: BookPlan = {
        title: 'My Book',
        totalChapters: 2,
        estimatedWordCount: 6000,
        structure: 'three-act',
        chapters,
        acts: [],
      };

      act(() => {
        result.current.updatePlan(project.id, plan);
      });

      act(() => {
        result.current.updateChapter(project.id, 1, { title: 'Updated Chapter 1' });
      });

      const updatedProject = result.current.projects.find(p => p.id === project.id);
      const chapters2 = updatedProject!.plan!.chapters;

      expect(chapters2[0].title).toBe('Updated Chapter 1');
      expect(chapters2[1].title).toBe('Chapter 2'); // Unchanged
    });

    it('handles project without plan gracefully', () => {
      const { result } = renderHook(() => useProjectStore());

      let project: Project;
      act(() => {
        project = result.current.createProject({ name: 'Test' });
      });

      act(() => {
        result.current.updateChapter(project.id, 1, { title: 'Updated' });
      });

      const updatedProject = result.current.projects.find(p => p.id === project.id);
      expect(updatedProject!.plan).toBeNull();
    });
  });

  describe('save status management', () => {
    it('tracks saving state', () => {
      const { result } = renderHook(() => useProjectStore());

      expect(result.current.isSaving).toBe(false);

      act(() => {
        result.current.setSaving(true);
      });

      expect(result.current.isSaving).toBe(true);

      act(() => {
        result.current.setSaving(false);
      });

      expect(result.current.isSaving).toBe(false);
    });

    it('tracks save errors', () => {
      const { result } = renderHook(() => useProjectStore());

      expect(result.current.saveError).toBeNull();

      act(() => {
        result.current.setSaveError('Failed to save');
      });

      expect(result.current.saveError).toBe('Failed to save');

      act(() => {
        result.current.setSaveError(null);
      });

      expect(result.current.saveError).toBeNull();
    });

    it('tracks last saved timestamp', () => {
      const { result } = renderHook(() => useProjectStore());

      expect(result.current.lastSavedAt).toBeNull();

      const timestamp = Date.now();
      act(() => {
        result.current.setLastSavedAt(timestamp);
      });

      expect(result.current.lastSavedAt).toBe(timestamp);
    });
  });
});
