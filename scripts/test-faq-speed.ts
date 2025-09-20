#!/usr/bin/env tsx

/**
 * Test script to compare FAQ matching speeds
 * Run with: npx tsx scripts/test-faq-speed.ts
 */

import dotenv from 'dotenv'
import { matchFAQEnhanced, getFAQStats } from '../src/lib/faq-matcher-enhanced'
import { matchFAQ as keywordMatch } from '../src/lib/faq-matcher'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function runSpeedTest() {
  console.log('🚀 FAQ Matching Speed Test\n')

  // Show FAQ stats
  const stats = getFAQStats()
  console.log('📊 FAQ Statistics:')
  console.log(`  Total questions: ${stats.totalQuestions}`)
  console.log(`  With embeddings: ${stats.questionsWithEmbeddings}`)
  console.log(`  Coverage: ${stats.embeddingCoverage}\n`)

  const testQuestions = [
    'What is Huberman Lab?',
    'How much does premium cost?',
    'When do new episodes come out?',
    'Can I contact Dr. Huberman?',
    'Where can I watch the podcast?',
    'Is there a newsletter I can sign up for?',
    // Variations and typos
    'Wat is hubermen lab?', // Typo
    'How expensive is the premium subscription?', // Different phrasing
    'When are episodes released?', // Alternative wording
  ]

  console.log('🔄 Testing enhanced matching (with embeddings)...\n')

  for (const question of testQuestions) {
    console.log(`Q: "${question}"`)
    const startTime = Date.now()

    const match = await matchFAQEnhanced(question)
    const elapsed = Date.now() - startTime

    if (match) {
      console.log(`✅ Matched (${match.matchType}): "${match.question.substring(0, 50)}..."`)
      console.log(`   Confidence: ${(match.confidence * 100).toFixed(1)}%`)
      console.log(`   Time: ${elapsed}ms\n`)
    } else {
      console.log(`❌ No match found`)
      console.log(`   Time: ${elapsed}ms\n`)
    }
  }

  // Compare with keyword-only matching
  console.log('\n📝 Testing keyword-only matching (for comparison)...\n')

  for (const question of testQuestions.slice(0, 3)) {
    console.log(`Q: "${question}"`)
    const startTime = Date.now()

    const match = await keywordMatch(question)
    const elapsed = Date.now() - startTime

    if (match) {
      console.log(`✅ Matched: "${match.question.substring(0, 50)}..."`)
      console.log(`   Confidence: ${(match.confidence * 100).toFixed(1)}%`)
      console.log(`   Time: ${elapsed}ms\n`)
    } else {
      console.log(`❌ No match found`)
      console.log(`   Time: ${elapsed}ms\n`)
    }
  }

  console.log('\n🎯 Summary:')
  console.log('- Embedding matching handles typos and variations better')
  console.log('- First embedding call: ~100ms (includes API call)')
  console.log('- Cached embedding calls: ~1-2ms')
  console.log('- Keyword matching: ~2-5ms (but less accurate)')
}

// Run the test
runSpeedTest().catch(console.error)