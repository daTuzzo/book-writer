/**
 * Optimized book analysis with chunking and parallel processing.
 *
 * Strategy:
 * 1. Split book into chunks at natural boundaries (chapters/paragraphs)
 * 2. Process chunks in parallel using Gemini Flash (faster model)
 * 3. Merge results and deduplicate characters/locations
 * 4. Optional: Run deeper style analysis on a representative sample
 */

import { generateContent, MODELS, ThinkingLevel } from './gemini-client';

// Target chunk size in characters (~7500 tokens at 4 chars/token)
const TARGET_CHUNK_SIZE = 30000;
const MIN_CHUNK_SIZE = 10000;
const MAX_PARALLEL_CHUNKS = 5;

export interface BookChunk {
  index: number;
  content: string;
  startOffset: number;
  endOffset: number;
  estimatedTokens: number;
}

export interface ChunkAnalysisResult {
  chunkIndex: number;
  chapters: Array<{
    chapterNumber: number;
    title: string;
    content: string;
    summary: string;
  }>;
  characters: Array<{
    name: string;
    description: string;
    traits: string[];
  }>;
  locations: Array<{
    name: string;
    description: string;
    type: string;
  }>;
}

export interface MergedAnalysisResult {
  chapters: Array<{
    chapterNumber: number;
    title: string;
    content: string;
    summary: string;
  }>;
  characters: Array<{
    name: string;
    description: string;
    traits: string[];
  }>;
  locations: Array<{
    name: string;
    description: string;
    type: string;
  }>;
  styleAnalysis: {
    tone: string;
    pov: string;
    tense: string;
    descriptionDensity: string;
    dialogueStyle: string;
  };
}

/**
 * Splits book text into chunks at natural boundaries.
 * Prioritizes: chapter breaks > double newlines > single newlines > word boundaries
 */
export function chunkBookText(text: string): BookChunk[] {
  const chunks: BookChunk[] = [];
  let currentPosition = 0;
  let chunkIndex = 0;

  // Chapter boundary patterns (Bulgarian + generic)
  const chapterPatterns = [
    /\n\s*(Глава|ГЛАВА|Част|ЧАСТ)\s+[\dIVXLCDM]+[^\n]*/gi,
    /\n\s*(Chapter|CHAPTER)\s+[\dIVXLCDM]+[^\n]*/gi,
    /\n\s*[\dIVXLCDM]+\s*[\.\)]\s*[^\n]*/g, // "1." or "I)" style
    /\n={3,}\n/g, // Separator lines
    /\n-{3,}\n/g,
    /\n\*{3,}\n/g,
  ];

  while (currentPosition < text.length) {
    const remainingText = text.substring(currentPosition);
    let chunkEnd = Math.min(currentPosition + TARGET_CHUNK_SIZE, text.length);

    if (chunkEnd < text.length) {
      // Find the best break point
      const searchStart = Math.max(0, chunkEnd - currentPosition - 5000);
      const searchEnd = Math.min(remainingText.length, chunkEnd - currentPosition + 2000);
      const searchArea = remainingText.substring(searchStart, searchEnd);

      let bestBreak = -1;
      let breakType = 'none';

      // Priority 1: Chapter boundaries
      for (const pattern of chapterPatterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(searchArea)) !== null) {
          const breakPos = searchStart + match.index;
          if (breakPos >= MIN_CHUNK_SIZE - currentPosition && breakPos <= TARGET_CHUNK_SIZE + 2000) {
            bestBreak = breakPos;
            breakType = 'chapter';
            break;
          }
        }
        if (bestBreak !== -1) break;
      }

      // Priority 2: Double newlines (paragraph breaks)
      if (bestBreak === -1) {
        const doubleNewline = searchArea.lastIndexOf('\n\n');
        if (doubleNewline !== -1 && searchStart + doubleNewline >= MIN_CHUNK_SIZE) {
          bestBreak = searchStart + doubleNewline;
          breakType = 'paragraph';
        }
      }

      // Priority 3: Single newline
      if (bestBreak === -1) {
        const singleNewline = searchArea.lastIndexOf('\n');
        if (singleNewline !== -1 && searchStart + singleNewline >= MIN_CHUNK_SIZE) {
          bestBreak = searchStart + singleNewline;
          breakType = 'line';
        }
      }

      // Priority 4: Word boundary (space)
      if (bestBreak === -1) {
        const space = searchArea.lastIndexOf(' ');
        if (space !== -1) {
          bestBreak = searchStart + space;
          breakType = 'word';
        }
      }

      // Apply break point
      if (bestBreak !== -1) {
        chunkEnd = currentPosition + bestBreak;
      }
    }

    const chunkContent = text.substring(currentPosition, chunkEnd).trim();

    if (chunkContent.length > 0) {
      chunks.push({
        index: chunkIndex++,
        content: chunkContent,
        startOffset: currentPosition,
        endOffset: chunkEnd,
        estimatedTokens: Math.ceil(chunkContent.length / 4),
      });
    }

    currentPosition = chunkEnd;
    // Skip whitespace at the start of next chunk
    while (currentPosition < text.length && /\s/.test(text[currentPosition])) {
      currentPosition++;
    }
  }

  return chunks;
}

/**
 * Analyzes a single chunk for characters, locations, and chapter structure.
 */
async function analyzeChunk(
  chunk: BookChunk,
  isFirstChunk: boolean,
  totalChunks: number,
  onProgress?: (message: string) => void
): Promise<ChunkAnalysisResult> {
  const chunkPrompt = `You are analyzing part ${chunk.index + 1} of ${totalChunks} of a Bulgarian book.

TASK: Extract chapters, characters, and locations from this text segment.

${isFirstChunk ? 'This is the BEGINNING of the book.' : `This is a MIDDLE section (part ${chunk.index + 1}).`}

TEXT SEGMENT:
${chunk.content}

OUTPUT FORMAT - Return ONLY valid JSON:
{
  "chapters": [
    {
      "chapterNumber": <number based on context or position>,
      "title": "<chapter title if found, or generate descriptive title in Bulgarian>",
      "content": "<full chapter text from this segment>",
      "summary": "<brief summary in Bulgarian>"
    }
  ],
  "characters": [
    {
      "name": "<character name>",
      "description": "<brief description in Bulgarian>",
      "traits": ["trait1", "trait2"]
    }
  ],
  "locations": [
    {
      "name": "<location name>",
      "description": "<description in Bulgarian>",
      "type": "city|village|building|nature|other"
    }
  ]
}

IMPORTANT:
- Include ALL text from this segment in chapters - don't skip content
- If no clear chapter breaks exist, treat the whole segment as one chapter
- Extract ALL character and location names you find
- All descriptions in Bulgarian`;

  const systemPrompt = `You are a book analysis expert for Bulgarian literature. Extract structural information quickly and accurately. Return ONLY valid JSON.`;

  onProgress?.(`Analyzing chunk ${chunk.index + 1}/${totalChunks}...`);

  const { text: responseText } = await generateContent(
    chunkPrompt,
    systemPrompt,
    {
      model: MODELS.FLASH, // Use Flash for speed!
      thinkingLevel: ThinkingLevel.LOW, // Minimal thinking for extraction
      temperature: 0.2,
      maxOutputTokens: 16384,
    }
  );

  // Parse JSON response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error(`Chunk ${chunk.index}: No JSON in response`);
    return {
      chunkIndex: chunk.index,
      chapters: [{
        chapterNumber: chunk.index + 1,
        title: `Част ${chunk.index + 1}`,
        content: chunk.content,
        summary: 'Автоматично разделена част',
      }],
      characters: [],
      locations: [],
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      chunkIndex: chunk.index,
      chapters: parsed.chapters || [],
      characters: parsed.characters || [],
      locations: parsed.locations || [],
    };
  } catch (e) {
    console.error(`Chunk ${chunk.index}: JSON parse error`, e);
    return {
      chunkIndex: chunk.index,
      chapters: [{
        chapterNumber: chunk.index + 1,
        title: `Част ${chunk.index + 1}`,
        content: chunk.content,
        summary: 'Автоматично разделена част',
      }],
      characters: [],
      locations: [],
    };
  }
}

/**
 * Analyzes writing style from a sample of the book.
 */
async function analyzeStyle(
  sampleText: string,
  onProgress?: (message: string) => void
): Promise<MergedAnalysisResult['styleAnalysis']> {
  onProgress?.('Analyzing writing style...');

  const stylePrompt = `Analyze the writing style of this Bulgarian text sample:

TEXT SAMPLE:
${sampleText}

OUTPUT FORMAT - Return ONLY valid JSON:
{
  "tone": "<description of emotional tone in Bulgarian>",
  "pov": "first|third-limited|third-omniscient",
  "tense": "past|present",
  "descriptionDensity": "sparse|moderate|rich",
  "dialogueStyle": "<description of dialogue style in Bulgarian>"
}`;

  const { text: responseText } = await generateContent(
    stylePrompt,
    'You are a literary style analyst for Bulgarian fiction. Return ONLY valid JSON.',
    {
      model: MODELS.FLASH,
      thinkingLevel: ThinkingLevel.LOW,
      temperature: 0.2,
      maxOutputTokens: 1024,
    }
  );

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // Fall through to default
    }
  }

  return {
    tone: 'Неутрален',
    pov: 'third-omniscient',
    tense: 'past',
    descriptionDensity: 'moderate',
    dialogueStyle: 'Стандартен диалог',
  };
}

/**
 * Merges results from multiple chunk analyses.
 * Deduplicates characters and locations by name similarity.
 */
function mergeChunkResults(results: ChunkAnalysisResult[]): Omit<MergedAnalysisResult, 'styleAnalysis'> {
  // Sort by chunk index to maintain order
  const sorted = [...results].sort((a, b) => a.chunkIndex - b.chunkIndex);

  // Merge chapters with renumbering
  const chapters: MergedAnalysisResult['chapters'] = [];
  let chapterNumber = 1;
  for (const result of sorted) {
    for (const chapter of result.chapters) {
      chapters.push({
        ...chapter,
        chapterNumber: chapterNumber++,
      });
    }
  }

  // Deduplicate characters by normalized name
  const characterMap = new Map<string, MergedAnalysisResult['characters'][0]>();
  for (const result of sorted) {
    for (const char of result.characters) {
      const normalizedName = char.name.toLowerCase().trim();
      const existing = characterMap.get(normalizedName);
      if (existing) {
        // Merge traits
        const allTraits = new Set([...existing.traits, ...char.traits]);
        existing.traits = Array.from(allTraits);
        // Keep longer description
        if (char.description.length > existing.description.length) {
          existing.description = char.description;
        }
      } else {
        characterMap.set(normalizedName, { ...char });
      }
    }
  }

  // Deduplicate locations by normalized name
  const locationMap = new Map<string, MergedAnalysisResult['locations'][0]>();
  for (const result of sorted) {
    for (const loc of result.locations) {
      const normalizedName = loc.name.toLowerCase().trim();
      const existing = locationMap.get(normalizedName);
      if (!existing || loc.description.length > existing.description.length) {
        locationMap.set(normalizedName, { ...loc });
      }
    }
  }

  return {
    chapters,
    characters: Array.from(characterMap.values()),
    locations: Array.from(locationMap.values()),
  };
}

/**
 * Processes chunks in parallel batches.
 */
async function processChunksInParallel(
  chunks: BookChunk[],
  onProgress?: (message: string) => void
): Promise<ChunkAnalysisResult[]> {
  const results: ChunkAnalysisResult[] = [];

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < chunks.length; i += MAX_PARALLEL_CHUNKS) {
    const batch = chunks.slice(i, i + MAX_PARALLEL_CHUNKS);
    onProgress?.(`Processing batch ${Math.floor(i / MAX_PARALLEL_CHUNKS) + 1}/${Math.ceil(chunks.length / MAX_PARALLEL_CHUNKS)}...`);

    const batchResults = await Promise.all(
      batch.map((chunk) => analyzeChunk(chunk, chunk.index === 0, chunks.length, onProgress))
    );

    results.push(...batchResults);
  }

  return results;
}

/**
 * Main entry point for optimized book analysis.
 * Uses chunking + parallel processing + Gemini Flash for 5-10x speedup.
 */
export async function analyzeBookOptimized(
  text: string,
  onProgress?: (message: string) => void
): Promise<MergedAnalysisResult> {
  const startTime = Date.now();

  onProgress?.('Starting optimized book analysis...');

  // Step 1: Chunk the book
  onProgress?.('Splitting book into chunks...');
  const chunks = chunkBookText(text);
  onProgress?.(`Split into ${chunks.length} chunks`);

  // Step 2: Analyze chunks in parallel
  const chunkResults = await processChunksInParallel(chunks, onProgress);

  // Step 3: Merge results
  onProgress?.('Merging analysis results...');
  const merged = mergeChunkResults(chunkResults);

  // Step 4: Analyze style from a sample (first 20k chars + middle + end samples)
  const sampleSize = 8000;
  const styleSample = [
    text.substring(0, sampleSize),
    text.substring(Math.floor(text.length / 2) - sampleSize / 2, Math.floor(text.length / 2) + sampleSize / 2),
    text.substring(Math.max(0, text.length - sampleSize)),
  ].join('\n\n---\n\n');

  const styleAnalysis = await analyzeStyle(styleSample, onProgress);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  onProgress?.(`Analysis complete in ${elapsed}s`);

  return {
    ...merged,
    styleAnalysis,
  };
}

/**
 * Estimates if the text needs chunked processing.
 */
export function needsChunkedProcessing(text: string): boolean {
  // If text is over ~40k tokens, use chunked processing
  return text.length > 160000;
}
