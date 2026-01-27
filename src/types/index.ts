// Project Types
export interface Project {
  id: string;
  name: string;
  description: string;
  genre: string;
  style: string;
  complexity: 'simple' | 'moderate' | 'complex';
  targetAudience: string;
  createdAt: string;
  updatedAt: string;
  masterJson: MasterJSON;
  plan: BookPlan | null;
}

// MasterJSON Types
export interface MasterJSON {
  projectMetadata: ProjectMetadata;
  characters: CharacterSystem;
  locations: LocationSystem;
  plotElements: PlotElements;
  worldBuilding: WorldBuilding;
  continuityRules: ContinuityRule[];
  styleGuide: StyleGuide;
  timeline: Timeline;
}

export interface ProjectMetadata {
  title: string;
  genre: string;
  style: string;
  targetWordCount: number;
  currentWordCount: number;
}

export interface CharacterSystem {
  permanent: Record<string, Character>;
  timeline: CharacterChange[];
}

export interface Character {
  id: string;
  name: string;
  age: string;
  gender: string;
  physicalDescription: string;
  personality: string[];
  background: string;
  motivations: string[];
  relationships: Relationship[];
  speechPatterns: string;
  beliefs: string[];
}

export interface CharacterChange {
  characterId: string;
  chapter: number;
  event: string;
  change: string;
  affectedProperties: string[];
  persistsFrom: number;
  persistsTo: number | null;
}

export interface Relationship {
  characterId: string;
  type: string;
  description: string;
}

export interface LocationSystem {
  permanent: Record<string, Location>;
  timeline: LocationChange[];
}

export interface Location {
  id: string;
  name: string;
  type: string;
  description: string;
  geography: string;
  climate: string;
  atmosphere: string;
  significance: string;
  connectedLocations: string[];
}

export interface LocationChange {
  locationId: string;
  chapter: number;
  event: string;
  change: string;
  affectedProperties: string[];
  persistsFrom: number;
  persistsTo: number | null;
}

export interface PlotElements {
  mainPlot: PlotPoint;
  subplots: PlotPoint[];
  themes: string[];
  motifs: string[];
}

export interface PlotPoint {
  id: string;
  title: string;
  description: string;
  status: 'setup' | 'development' | 'climax' | 'resolution';
}

export interface WorldBuilding {
  rules: string[];
  history: string[];
  culture: string[];
}

export interface ContinuityRule {
  id: string;
  rule: string;
  category: 'physical' | 'character' | 'plot' | 'world';
  importance: 'critical' | 'important' | 'minor';
}

export interface StyleGuide {
  tone: string;
  pov: 'first' | 'second' | 'third-limited' | 'third-omniscient';
  tense: 'past' | 'present';
  vocabulary: string[];
  avoidWords: string[];
  writingPatterns: string[];
  analyzedStyle: AnalyzedStyle | null;
}

export interface AnalyzedStyle {
  sentenceLength: 'short' | 'medium' | 'long' | 'varied';
  paragraphLength: 'short' | 'medium' | 'long';
  dialogueStyle: string;
  descriptionDensity: 'sparse' | 'moderate' | 'rich';
  emotionalTone: string;
  pacingStyle: string;
  samplePhrases: string[];
}

export interface Timeline {
  events: TimelineEvent[];
  currentPosition: string;
}

export interface TimelineEvent {
  id: string;
  chapter: number;
  description: string;
  characters: string[];
  locations: string[];
  timestamp: string;
}

// Book Plan Types
export interface BookPlan {
  title: string;
  totalChapters: number;
  estimatedWordCount: number;
  structure: 'three-act' | 'five-act' | 'hero-journey' | 'custom';
  chapters: Chapter[];
  acts: Act[];
}

export interface Chapter {
  chapterNumber: number;
  title: string;
  summary: string;
  keyEvents: string[];
  charactersInvolved: string[];
  locationsUsed: string[];
  emotionalArc: string;
  plotProgressions: string[];
  targetWordCount: number;
  actualWordCount: number;
  status: 'planned' | 'in-progress' | 'draft' | 'revised' | 'complete';
  sections: Section[];
  content: string;
}

export interface Section {
  sectionId: string;
  title: string;
  summary: string;
  content: string;
  status: 'planned' | 'in-progress' | 'draft' | 'revised' | 'complete';
}

export interface Act {
  actNumber: number;
  title: string;
  chapters: number[];
  purpose: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isEdited: boolean;
  originalContent?: string;
  metadata?: {
    tokensUsed?: number;
    model?: string;
    generationType?: string;
  };
}

export interface ChatContext {
  includeFullBook: boolean;
  includeMasterJson: boolean;
  selectedChapters: number[];
  mentionedElements: MentionedElement[];
}

export interface MentionedElement {
  type: 'chapter' | 'character' | 'location' | 'plot';
  id: string;
  name: string;
}

// AI Types
export interface GenerationRequest {
  type: 'full-chapter' | 'section' | 'paragraph' | 'continue' | 'fill-gap';
  chapterId: number;
  sectionId?: string;
  selectionStart?: number;
  selectionEnd?: number;
  additionalInstructions?: string;
}

export interface EditRequest {
  type: 'shorten' | 'expand' | 'restyle' | 'simplify' | 'enhance' | 'grammar' | 'rewrite';
  content: string;
  targetStyle?: string;
  targetLength?: number;
}

export interface AIResponse {
  content: string;
  tokensUsed: number;
  model: string;
  thoughtSignature?: string;
}

// UI Types
export interface UIState {
  sidebarOpen: boolean;
  chatPanelOpen: boolean;
  chatPanelWidth: number;
  theme: 'light' | 'dark';
  editorFont: string;
  editorFontSize: number;
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
}
