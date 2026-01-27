# 📚 Book Writer - Comprehensive Project Plan

## Overview

A Next.js application for AI-assisted book writing using Google Gemini 3 Pro and Gemini 3 Flash models. The app is designed for Bulgarian language output with English system prompts. It features a multi-agent architecture with a central "MasterJSON" system that serves as the Bible for story consistency.

---

## 🎯 Core Features

### 1. Project Management

#### 1.1 Create New Project
- **Project Name**: Title of the book/project
- **Description**: Brief synopsis or concept
- **Genre**: Novel, novella, short story, fantasy, sci-fi, romance, thriller, etc.
- **Writing Style**: Literary, commercial, poetic, minimalist, descriptive, etc.
- **Complexity Level**: Simple, moderate, complex
- **Target Audience**: Children, young adult, adult
- **Language Settings**: Bulgarian output (default), with English system prompts

#### 1.2 Context Files Upload
- Upload previous writings for style analysis
- Upload reference materials (PDFs, DOCX, TXT)
- Upload character sheets, world-building documents
- Upload inspiration images (for future multimodal features)
- File parsing and text extraction
- Style analysis agent that learns from uploaded content

#### 1.3 Import Existing Work
- Import previously written chapters into the plan structure
- Map imported content to specific chapters/sections
- Preserve formatting and structure
- Merge with AI-generated plan seamlessly

---

### 2. MasterJSON System (The Bible)

The MasterJSON is the central truth of the entire project. Every agent references this before generating content.

#### 2.1 Structure

```json
{
  "projectMetadata": {
    "title": "",
    "genre": "",
    "style": "",
    "targetWordCount": 0,
    "currentWordCount": 0
  },
  "characters": {
    "permanent": {},
    "timeline": []
  },
  "locations": {
    "permanent": {},
    "timeline": []
  },
  "plotElements": {
    "mainPlot": {},
    "subplots": [],
    "themes": [],
    "motifs": []
  },
  "worldBuilding": {
    "rules": [],
    "history": [],
    "culture": []
  },
  "continuityRules": [],
  "styleGuide": {
    "tone": "",
    "pov": "",
    "tense": "",
    "vocabulary": [],
    "avoidWords": [],
    "writingPatterns": []
  },
  "timeline": {
    "events": [],
    "currentPosition": ""
  }
}
```

#### 2.2 Character System

##### Permanent Properties
- Name, age, gender, physical description
- Personality traits, background, motivations
- Relationships with other characters
- Voice/speech patterns
- Core beliefs and values

##### Timeline-Based Changes
```json
{
  "characterId": "char_001",
  "changes": [
    {
      "chapter": 3,
      "event": "Battle of the Northern Valley",
      "change": "Receives scar on left cheek",
      "affectedProperties": ["physicalDescription"],
      "persistsFrom": 3,
      "persistsTo": null
    }
  ]
}
```

#### 2.3 Location System

##### Permanent Properties
- Name, type, description
- Geography, climate, atmosphere
- Significance to plot
- Connected locations

##### Timeline-Based Changes
- Destruction, renovation, discovery
- Seasonal changes
- Ownership changes
- Events that occurred there

#### 2.4 Continuity Rules
- Rules that must never be broken
- Physical laws of the world
- Character limitations
- Plot constraints
- Foreshadowing elements to maintain

---

### 3. Book Plan Generation

#### 3.1 Plan Structure Schema

```json
{
  "bookPlan": {
    "title": "",
    "totalChapters": 0,
    "estimatedWordCount": 0,
    "structure": "three-act" | "five-act" | "hero-journey" | "custom",
    "chapters": [
      {
        "chapterNumber": 1,
        "title": "",
        "summary": "",
        "keyEvents": [],
        "charactersInvolved": [],
        "locationsUsed": [],
        "emotionalArc": "",
        "plotProgressions": [],
        "targetWordCount": 0,
        "actualWordCount": 0,
        "status": "planned" | "in-progress" | "draft" | "revised" | "complete",
        "sections": [
          {
            "sectionId": "",
            "title": "",
            "summary": "",
            "content": "",
            "status": ""
          }
        ]
      }
    ],
    "acts": [
      {
        "actNumber": 1,
        "title": "",
        "chapters": [1, 2, 3],
        "purpose": ""
      }
    ]
  }
}
```

#### 3.2 Plan Generation Features
- AI generates initial plan based on project settings
- **Fully editable**: Every field can be manually edited
- Extend or shorten chapter count
- Adjust complexity and detail level
- Reorder chapters via drag-and-drop
- Add/remove plot points
- Regenerate specific sections
- Version history for plan changes

#### 3.3 Plan Editing Tools
- Inline editing for all fields
- Bulk operations (apply style to multiple chapters)
- AI suggestions for improvements
- Consistency checker against MasterJSON
- Word count targets and tracking

---

### 4. Writing Interface

#### 4.1 Main Editor (Canvas-like)
- Rich text editor using TipTap
- Full-page writing mode
- Distraction-free option
- Dark/light theme
- Font customization
- Line spacing options
- Word count display (selection, chapter, total)

#### 4.2 AI Writing Tools

##### Generation Options
- **Write Full Chapter**: Generate entire chapter content
- **Write Section**: Generate specific section within chapter
- **Write Paragraph**: Generate single paragraph
- **Continue Writing**: Continue from cursor position
- **Fill Gap**: Write content between two selected points

##### Modification Tools (ChatGPT Canvas-style)
- **Shorten**: Reduce word count while keeping essence
- **Expand**: Add more detail and description
- **Change Style**: Adjust tone, formality, pace
- **Simplify**: Make language more accessible
- **Enhance**: Add literary flourishes
- **Fix Grammar**: Bulgarian grammar corrections
- **Rewrite**: Complete rewrite of selection

##### Context Options
- Select which previous chapters to include
- Token count calculator before generation
- Automatic context from MasterJSON
- Manual excerpt selection
- @ mentions for specific elements

#### 4.3 Editable AI Output
- **Critical Feature**: Every AI generation appears in an editable state
- User can modify before accepting
- Modified version becomes the canonical context
- History of original vs. edited versions
- Accept/Reject/Edit workflow

---

### 5. Chat Interface

#### 5.1 Layout
- Right-side panel (collapsible)
- Resizable width
- Persistent conversation per chapter
- Multiple conversation threads

#### 5.2 Features
- Natural language discussion about the chapter
- @ mentions system:
  - `@Chapter1` - Reference specific chapter
  - `@CharacterName` - Reference character from MasterJSON
  - `@LocationName` - Reference location
  - `@Plot:MainConflict` - Reference plot element
- Quick actions:
  - "Започни писането на тази глава" (Start writing this chapter)
  - "Анализирай предишните глави" (Analyze previous chapters)
  - "Провери за несъответствия" (Check for inconsistencies)

#### 5.3 Context Controls
- Toggle: Include full book context
- Toggle: Include MasterJSON
- Manual chapter selection for context
- Token usage display
- Estimated cost display

---

### 6. Agent Architecture

#### 6.1 MasterJSON Agent
- **Role**: Guardian of story consistency
- **Input**: All write requests pass through this agent
- **Output**: Verified context, warnings about inconsistencies
- **Language**: System prompt in English, outputs in Bulgarian

#### 6.2 Style Analysis Agent
- **Role**: Analyze and replicate writing style
- **Input**: Uploaded writing samples
- **Output**: Style profile (sentence structure, vocabulary, rhythm, etc.)
- **Stored in**: MasterJSON.styleGuide

#### 6.3 Plan Generation Agent
- **Role**: Create and modify book structure
- **Model**: Gemini 3 Pro (complex reasoning)
- **Output**: Structured JSON following plan schema

#### 6.4 Writing Agent
- **Role**: Generate actual prose content
- **Model**: Gemini 3 Pro for quality, Flash for speed
- **Context**: MasterJSON + selected chapters + current plan
- **Output**: Bulgarian prose matching style guide

#### 6.5 Editor Agent
- **Role**: Modify existing content
- **Operations**: Shorten, expand, restyle, grammar check
- **Preserves**: Author's intent and voice

#### 6.6 Continuity Agent
- **Role**: Check for plot holes and inconsistencies
- **Runs**: Before finalizing any chapter
- **Output**: List of potential issues with suggestions

#### 6.7 Grammar Agent
- **Role**: Bulgarian language specialist
- **Features**: Grammar, spelling, punctuation, style
- **Model**: Gemini 3 Flash (fast iterations)

---

### 7. Google Drive Integration

#### 7.1 Authentication
- OAuth 2.0 with Google
- Scopes: Drive file management, Google Docs
- Secure token storage

#### 7.2 Save Features
- **Auto-save**: Configurable interval (1, 5, 10 minutes)
- **Manual save**: Button always available
- **Save formats**:
  - Google Docs (preferred, formatted)
  - JSON backup (full project state)
  - Plain text export

#### 7.3 Google Docs Structure
- One master document per project
- Table of contents
- Styled headings per chapter
- Proper Bulgarian formatting
- Comments for AI-human collaboration notes

#### 7.4 Sync Features
- Real-time sync indicator
- Offline mode with queue
- Conflict resolution
- Version history via Drive

---

### 8. Token Management

#### 8.1 Token Calculator
- Pre-calculation before any generation
- Display input tokens: MasterJSON + context + prompt
- Display estimated output tokens
- Warning if approaching context limit (1M tokens for Gemini 3)

#### 8.2 Context Optimization
- Smart context selection
- Summarize old chapters option
- Prioritize relevant characters/locations
- Chunking for very long contexts

#### 8.3 Cost Estimation
- Display estimated API cost
- Track usage per session
- Monthly usage dashboard

---

### 9. UI/UX Design

#### 9.1 Design Principles
- Clean, minimalist interface
- Optimized for long writing sessions
- Low eye strain (proper contrast)
- Keyboard shortcuts for everything
- Bulgarian language throughout UI

#### 9.2 Layout

```
+--------------------------------------------------+
|  Header: Project Name | Save Status | Settings   |
+--------------------------------------------------+
|  Sidebar  |     Main Editor Area     | Chat      |
|           |                          | Panel     |
| Chapters  |  [Writing Canvas]        |           |
| Plan      |                          | [Chat     |
| MasterJSON|  [AI Tools Toolbar]      |  History] |
| Characters|                          |           |
| Locations |  [Content]               | [Input]   |
| Settings  |                          |           |
+--------------------------------------------------+
|  Footer: Word Count | Token Usage | Chapter Nav  |
+--------------------------------------------------+
```

#### 9.3 Theme
- Default: Dark mode (writer-friendly)
- Light mode option
- Custom accent colors
- Font family options (serif for writing, sans for UI)

#### 9.4 Responsive
- Desktop-first design
- Tablet support for review
- Mobile for reading only

---

### 10. Data Persistence

#### 10.1 Local Storage
- Auto-save to IndexedDB
- Offline capability
- Fast recovery from crashes

#### 10.2 Cloud Storage (Google Drive)
- Primary storage for production
- Structured folder hierarchy
- Automatic backups

#### 10.3 Export Options
- Google Docs
- Microsoft Word (.docx)
- PDF
- Plain text
- Markdown
- EPUB (future)

---

## 🏗️ Technical Architecture

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Radix UI + custom components
- **Editor**: TipTap (ProseMirror-based)
- **State Management**: Zustand
- **AI**: Google Gemini 3 Pro & Flash via @google/genai
- **Cloud**: Google Drive API via googleapis
- **Icons**: Lucide React
- **Deployment**: Vercel

### Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── callback/
│   ├── (dashboard)/
│   │   ├── projects/
│   │   ├── project/[id]/
│   │   │   ├── plan/
│   │   │   ├── write/[chapterId]/
│   │   │   ├── master-json/
│   │   │   ├── characters/
│   │   │   ├── locations/
│   │   │   └── settings/
│   │   └── settings/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── generate/
│   │   │   ├── edit/
│   │   │   ├── analyze-style/
│   │   │   └── check-continuity/
│   │   ├── drive/
│   │   │   ├── save/
│   │   │   ├── load/
│   │   │   └── sync/
│   │   └── auth/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                    # Base UI components
│   ├── editor/                # TipTap editor components
│   ├── chat/                  # Chat interface
│   ├── plan/                  # Plan editor components
│   ├── master-json/           # MasterJSON editor
│   ├── sidebar/               # Navigation sidebar
│   └── modals/                # Dialog modals
├── lib/
│   ├── ai/
│   │   ├── agents/
│   │   │   ├── master-json-agent.ts
│   │   │   ├── style-agent.ts
│   │   │   ├── plan-agent.ts
│   │   │   ├── writing-agent.ts
│   │   │   ├── editor-agent.ts
│   │   │   ├── continuity-agent.ts
│   │   │   └── grammar-agent.ts
│   │   ├── prompts/
│   │   │   └── *.ts           # System prompts (English)
│   │   └── gemini-client.ts
│   ├── drive/
│   │   ├── auth.ts
│   │   ├── client.ts
│   │   └── docs-formatter.ts
│   ├── schemas/
│   │   ├── project.ts
│   │   ├── master-json.ts
│   │   ├── plan.ts
│   │   └── chapter.ts
│   ├── utils/
│   │   ├── tokens.ts          # Token counting
│   │   └── formatters.ts
│   └── constants.ts
├── stores/
│   ├── project-store.ts
│   ├── editor-store.ts
│   ├── chat-store.ts
│   └── ui-store.ts
├── hooks/
│   ├── use-ai.ts
│   ├── use-drive.ts
│   ├── use-editor.ts
│   └── use-autosave.ts
├── types/
│   ├── project.ts
│   ├── master-json.ts
│   ├── chapter.ts
│   └── ai.ts
└── styles/
    └── globals.css
```

---

## 📋 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [x] Project setup (Next.js, TypeScript, Tailwind)
- [x] Basic UI layout and navigation
- [x] Project CRUD operations
- [x] Local storage implementation
- [x] Basic routing structure

### Phase 2: MasterJSON System (Week 2-3)
- [x] MasterJSON schema definition
- [x] Character management UI
- [x] Location management UI
- [x] Timeline tracking system
- [ ] Continuity rules editor (partial)

### Phase 3: Plan Generation (Week 3-4)
- [x] Gemini API integration
- [x] Plan generation agent
- [x] Plan editing interface
- [x] JSON schema enforcement
- [ ] Version control for plans

### Phase 4: Writing Interface (Week 4-6)
- [x] TipTap editor integration
- [x] Writing agent implementation
- [x] Canvas-style editing tools (shorten, expand, rewrite, grammar)
- [x] Selection-based operations
- [x] Context management for chapters

### Phase 5: Chat Interface (Week 6-7)
- [x] Chat UI component
- [x] @ mention system
- [x] Conversation history
- [x] Context toggles
- [x] Token calculator display

### Phase 6: Agent Interconnection (Week 7-8)
- [x] Style analysis agent
- [ ] Continuity checking agent
- [x] Grammar agent
- [x] Agent orchestration (via API routes)
- [x] Context sharing between agents (via MasterJSON)

### Phase 7: Google Drive Integration (Week 8-9)
- [x] OAuth implementation (NextAuth + Google Provider)
- [x] Save to Drive functionality
- [x] Google Docs formatting
- [ ] Auto-save feature
- [ ] Sync status UI

### Phase 8: Polish & Testing (Week 9-10)
- [x] Bulgarian translations (UI complete)
- [x] Error handling (basic)
- [x] Loading states
- [ ] Performance optimization
- [ ] User testing with father

---

## 🔑 Environment Variables

```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Google OAuth (for Drive)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **📖 За подробни инструкции за настройка, вижте [SETUP.md](./SETUP.md)**

---

## 📝 Bulgarian UI Translations

Key terms to translate:
- Нов проект (New Project)
- Запази (Save)
- Глава (Chapter)
- План (Plan)
- Персонажи (Characters)
- Локации (Locations)
- Редактирай (Edit)
- Генерирай (Generate)
- Съкрати (Shorten)
- Разшири (Expand)
- Промени стила (Change Style)
- Автоматично запазване (Auto-save)
- Чат (Chat)
- Настройки (Settings)
- Изтрий (Delete)
- Отмени (Cancel)
- Потвърди (Confirm)

---

## 🚀 Deployment

### Vercel Configuration
- Environment variables setup
- Google OAuth callback URL
- API routes optimization
- Edge functions for AI calls

### Post-Deployment
- Custom domain setup (optional)
- Monitoring and analytics
- Error tracking

---

## 📌 Important Notes

1. **AI Prompts**: All system prompts are in English with explicit instruction to output in Bulgarian
2. **Editability**: Every AI output must be editable before acceptance
3. **Context Persistence**: Edited AI outputs become the canonical context
4. **Manual Control**: No autonomous features yet - human approval for each generation
5. **Style Preservation**: AI must match the analyzed writing style from uploaded samples
6. **Token Awareness**: Always display token usage and costs before generation

---

## 🔮 Future Features (Not in Initial Scope)

- Automated chapter generation
- Multi-user collaboration
- Voice dictation
- AI illustration generation
- Publishing pipeline
- Mobile app
- Offline-first PWA
- Multiple book series management
- Character relationship graphs
- Timeline visualization
- Writing analytics and statistics

---

*Last Updated: January 5, 2026*
*Version: 1.1.0 - TipTap Editor, Google Drive OAuth, @ Mentions implemented*
