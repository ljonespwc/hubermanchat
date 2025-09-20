import { OpenAI } from 'openai'

// Cache for user question embeddings (LRU-style)
const embeddingCache = new Map<string, { embedding: number[], timestamp: number }>()
const MAX_CACHE_SIZE = 50
const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour

// OpenAI client (singleton)
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    })
  }
  return openaiClient
}

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same dimension')
  }

  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    norm1 += vec1[i] * vec1[i]
    norm2 += vec2[i] * vec2[i]
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2)
  return denominator === 0 ? 0 : dotProduct / denominator
}

/**
 * Get embedding for a user question (with caching)
 */
export async function getQuestionEmbedding(question: string): Promise<number[]> {
  // Normalize question for cache key
  const cacheKey = question.toLowerCase().trim()

  // Check cache first
  const cached = embeddingCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('📦 Using cached embedding for:', question.substring(0, 50))
    return cached.embedding
  }

  // Generate new embedding
  console.log('🔄 Generating embedding for:', question.substring(0, 50))

  try {
    const openai = getOpenAIClient()
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: question,
      dimensions: 512 // Must match FAQ embeddings
    })

    const embedding = response.data[0].embedding

    // Update cache (with LRU eviction)
    if (embeddingCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = embeddingCache.keys().next().value
      if (firstKey) {
        embeddingCache.delete(firstKey)
      }
    }

    embeddingCache.set(cacheKey, {
      embedding,
      timestamp: Date.now()
    })

    return embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

/**
 * Find the best matching FAQ using embeddings
 */
export interface EmbeddingMatch {
  question: string
  answer: string
  category: string
  similarity: number
}

export async function findBestEmbeddingMatch(
  userQuestion: string,
  faqData: any,
  threshold: number = 0.75
): Promise<EmbeddingMatch | null> {
  // Get embedding for user question
  const userEmbedding = await getQuestionEmbedding(userQuestion)

  let bestMatch: EmbeddingMatch | null = null
  let highestSimilarity = 0

  // Compare with all FAQ embeddings
  for (const category of faqData.categories) {
    for (const qa of category.questions) {
      if (!qa.embedding) {
        console.warn('Missing embedding for question:', qa.question)
        continue
      }

      const similarity = cosineSimilarity(userEmbedding, qa.embedding)

      if (similarity > highestSimilarity && similarity >= threshold) {
        highestSimilarity = similarity
        bestMatch = {
          question: qa.question,
          answer: qa.answer,
          category: category.name,
          similarity
        }
      }
    }
  }

  if (bestMatch) {
    console.log(`✅ Found match with ${(bestMatch.similarity * 100).toFixed(1)}% similarity`)
  } else {
    console.log(`❌ No match above ${(threshold * 100).toFixed(0)}% threshold`)
  }

  return bestMatch
}

/**
 * Pre-warm the cache with common questions
 */
export async function prewarmCache(commonQuestions: string[]) {
  console.log(`🔥 Pre-warming cache with ${commonQuestions.length} common questions...`)

  for (const question of commonQuestions) {
    try {
      await getQuestionEmbedding(question)
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 50))
    } catch (error) {
      console.error(`Failed to pre-warm: ${question}`, error)
    }
  }

  console.log(`✅ Cache pre-warmed with ${embeddingCache.size} embeddings`)
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: embeddingCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttlMs: CACHE_TTL_MS,
    hitRate: 0 // Could track this with additional counters
  }
}