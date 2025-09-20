#!/usr/bin/env tsx

/**
 * One-time script to generate embeddings for all FAQ questions
 * Run with: npx tsx scripts/generate-embeddings.ts
 */

import { OpenAI } from 'openai'
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

async function generateEmbeddings() {
  console.log('🚀 Starting FAQ embedding generation...')

  // Load existing FAQ data
  const faqPath = path.join(process.cwd(), 'docs', 'huberman_lab_faqs.json')
  const faqContent = await fs.readFile(faqPath, 'utf-8')
  const faqData = JSON.parse(faqContent)

  // Prepare all questions for embedding
  const allQuestions: Array<{ question: string; category: string; answer: string }> = []

  for (const category of faqData.categories) {
    for (const qa of category.questions) {
      allQuestions.push({
        question: qa.question,
        category: category.name,
        answer: qa.answer
      })
    }
  }

  console.log(`📊 Found ${allQuestions.length} questions to process`)

  // Generate embeddings in batches (OpenAI allows up to 2048 inputs per request)
  const embeddings: Record<string, number[]> = {}
  const batchSize = 20 // Conservative batch size

  for (let i = 0; i < allQuestions.length; i += batchSize) {
    const batch = allQuestions.slice(i, i + batchSize)
    const texts = batch.map(q => q.question)

    console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allQuestions.length / batchSize)}...`)

    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
        dimensions: 512 // Smaller dimension for faster similarity computation
      })

      // Map embeddings to questions
      response.data.forEach((embedding, index) => {
        const question = batch[index].question
        embeddings[question] = embedding.embedding
      })

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`❌ Error generating embeddings for batch:`, error)
      process.exit(1)
    }
  }

  // Create enhanced FAQ data with embeddings
  const enhancedFaqData = {
    ...faqData,
    embeddings_metadata: {
      model: 'text-embedding-3-small',
      dimensions: 512,
      generated_at: new Date().toISOString(),
      total_questions: allQuestions.length
    },
    categories: faqData.categories.map((category: any) => ({
      ...category,
      questions: category.questions.map((qa: any) => ({
        ...qa,
        embedding: embeddings[qa.question]
      }))
    }))
  }

  // Save the enhanced FAQ data
  const outputPath = path.join(process.cwd(), 'docs', 'huberman_lab_faqs_embedded.json')
  await fs.writeFile(outputPath, JSON.stringify(enhancedFaqData, null, 2))

  console.log(`✅ Successfully generated embeddings for ${allQuestions.length} questions`)
  console.log(`📁 Saved to: ${outputPath}`)

  // Calculate file size increase
  const originalSize = (await fs.stat(faqPath)).size
  const newSize = (await fs.stat(outputPath)).size
  const increase = ((newSize - originalSize) / 1024).toFixed(2)

  console.log(`📈 File size increased by ${increase}KB`)

  // Estimate cost
  const totalTokens = allQuestions.length * 10 // Rough estimate
  const cost = (totalTokens / 1000000) * 0.02 // $0.02 per 1M tokens for text-embedding-3-small
  console.log(`💰 Estimated cost: $${cost.toFixed(4)}`)
}

// Run the script
generateEmbeddings().catch(console.error)