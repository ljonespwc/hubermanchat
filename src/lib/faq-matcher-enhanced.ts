import { findBestEmbeddingMatch, type EmbeddingMatch } from './embedding-matcher'
import { matchFAQ as keywordMatch } from './faq-matcher'

// Try to load embedded FAQs, fall back to regular FAQs
let faqData: any
let hasEmbeddings = false

try {
  // Try to load FAQs with embeddings
  faqData = require('../../docs/huberman_lab_faqs_embedded.json')
  hasEmbeddings = true
  console.log('✅ Loaded FAQs with embeddings')
} catch (error) {
  // Fall back to regular FAQs
  console.log('⚠️ Embedded FAQs not found, falling back to regular FAQs')
  faqData = require('../../docs/huberman_lab_faqs.json')
  hasEmbeddings = false
}

export interface FAQMatch {
  question: string
  answer: string
  confidence: number
  category: string
  matchType: 'embedding' | 'keyword' | 'none'
}

/**
 * Enhanced FAQ matching using embeddings (if available) with keyword fallback
 */
export async function matchFAQEnhanced(userQuestion: string): Promise<FAQMatch | null> {
  const startTime = Date.now()

  // Try embedding-based matching first (if available)
  if (hasEmbeddings) {
    try {
      const embeddingMatch = await findBestEmbeddingMatch(
        userQuestion,
        faqData,
        0.75 // 75% similarity threshold
      )

      if (embeddingMatch) {
        const elapsed = Date.now() - startTime
        console.log(`⚡ Embedding match found in ${elapsed}ms`)

        return {
          question: embeddingMatch.question,
          answer: embeddingMatch.answer,
          confidence: embeddingMatch.similarity,
          category: embeddingMatch.category,
          matchType: 'embedding'
        }
      }
    } catch (error) {
      console.error('Embedding match failed, falling back to keyword match:', error)
    }
  }

  // Fall back to keyword matching
  console.log('🔍 Trying keyword match...')
  const keywordMatchResult = await keywordMatch(userQuestion)

  if (keywordMatchResult) {
    const elapsed = Date.now() - startTime
    console.log(`📝 Keyword match found in ${elapsed}ms`)

    return {
      ...keywordMatchResult,
      matchType: 'keyword'
    }
  }

  const elapsed = Date.now() - startTime
  console.log(`❌ No match found in ${elapsed}ms`)

  return null
}

/**
 * Get statistics about the FAQ system
 */
export function getFAQStats() {
  let totalQuestions = 0
  let questionsWithEmbeddings = 0

  for (const category of faqData.categories) {
    for (const qa of category.questions) {
      totalQuestions++
      if (qa.embedding) {
        questionsWithEmbeddings++
      }
    }
  }

  return {
    totalQuestions,
    questionsWithEmbeddings,
    hasEmbeddings,
    embeddingCoverage: totalQuestions > 0
      ? (questionsWithEmbeddings / totalQuestions * 100).toFixed(1) + '%'
      : '0%'
  }
}

/**
 * Pre-warm the embedding cache with common questions
 */
export async function prewarmFAQCache() {
  if (!hasEmbeddings) {
    console.log('⚠️ Skipping cache pre-warm (no embeddings available)')
    return
  }

  const commonQuestions = [
    'What is Huberman Lab?',
    'How do I get premium?',
    'When are new episodes?',
    'How to contact?',
    'What is the cost?',
    'Where can I watch?',
    'How to subscribe?',
    'Is there a newsletter?'
  ]

  const { prewarmCache } = await import('./embedding-matcher')
  await prewarmCache(commonQuestions)
}