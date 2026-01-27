import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Project } from '@/types';

interface BookWriterDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { 'by-updated': string };
  };
  backups: {
    key: string;
    value: {
      id: string;
      projectId: string;
      data: Project;
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<BookWriterDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<BookWriterDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BookWriterDB>('book-writer-db', 1, {
      upgrade(db) {
        // Projects store
        const projectStore = db.createObjectStore('projects', {
          keyPath: 'id',
        });
        projectStore.createIndex('by-updated', 'updatedAt');

        // Backups store for recovery
        db.createObjectStore('backups', {
          keyPath: 'id',
        });
      },
    });
  }
  return dbPromise;
}

export async function saveProjectToIDB(project: Project): Promise<void> {
  const db = await getDB();
  await db.put('projects', project);
}

export async function loadProjectFromIDB(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get('projects', id);
}

export async function getAllProjectsFromIDB(): Promise<Project[]> {
  const db = await getDB();
  return db.getAll('projects');
}

export async function deleteProjectFromIDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('projects', id);
}

export async function createBackup(project: Project): Promise<string> {
  const db = await getDB();
  const backupId = `backup-${project.id}-${Date.now()}`;
  await db.put('backups', {
    id: backupId,
    projectId: project.id,
    data: project,
    timestamp: Date.now(),
  });
  return backupId;
}

export async function getBackupsForProject(projectId: string): Promise<Array<{
  id: string;
  timestamp: number;
}>> {
  const db = await getDB();
  const allBackups = await db.getAll('backups');
  return allBackups
    .filter(b => b.projectId === projectId)
    .map(b => ({ id: b.id, timestamp: b.timestamp }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function restoreBackup(backupId: string): Promise<Project | null> {
  const db = await getDB();
  const backup = await db.get('backups', backupId);
  if (backup) {
    return backup.data;
  }
  return null;
}

// Sync all projects to IndexedDB (for initial migration from localStorage)
export async function syncAllProjects(projects: Project[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('projects', 'readwrite');
  await Promise.all([
    ...projects.map(project => tx.store.put(project)),
    tx.done,
  ]);
}

// Load all projects and merge with localStorage (recovery scenario)
export async function loadAndMergeProjects(localStorageProjects: Project[]): Promise<Project[]> {
  const idbProjects = await getAllProjectsFromIDB();
  
  // Create a map of all projects by ID
  const projectMap = new Map<string, Project>();
  
  // Add localStorage projects first
  for (const project of localStorageProjects) {
    projectMap.set(project.id, project);
  }
  
  // Override with IDB projects if they're newer
  for (const idbProject of idbProjects) {
    const existing = projectMap.get(idbProject.id);
    if (!existing || new Date(idbProject.updatedAt) > new Date(existing.updatedAt)) {
      projectMap.set(idbProject.id, idbProject);
    }
  }
  
  return Array.from(projectMap.values());
}
