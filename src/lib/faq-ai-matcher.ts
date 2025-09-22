import { OpenAI } from 'openai'
import faqData from '../../docs/huberman_lab_faqs.json'

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

export interface FAQMatch {
  question: string
  answer: string
  naturalAnswer: string  // AI's conversational version
  category: string
  confidence: 'high' | 'medium' | 'low'
}

export interface NoMatchResponse {
  type: 'no_match'
  response: string
}

/**
 * Use AI to find the best matching FAQ for a user question
 * Sends all FAQs to GPT-4.1-mini for intent matching
 * Returns either a match or a natural decline response
 */
export async function matchFAQWithAI(userQuestion: string): Promise<FAQMatch | NoMatchResponse | null> {
  try {
    // Prepare all FAQs in a numbered list
    const faqList: Array<{ num: number; question: string; answer: string; category: string }> = []
    let num = 1

    for (const category of faqData.categories) {
      for (const qa of category.questions) {
        faqList.push({
          num,
          question: qa.question,
          answer: qa.answer,
          category: category.name
        })
        num++
      }
    }

    // Add knowledge base context if available
    let knowledgeContext = ''
    if ('knowledge_base' in faqData && faqData.knowledge_base) {
      const kb = faqData.knowledge_base as Record<string, string>
      knowledgeContext = '\n\nAdditional Context about Dr. Huberman:\n'
      for (const [topic, content] of Object.entries(kb)) {
        knowledgeContext += `${topic}: ${content}\n\n`
      }
    }

    // Create the prompt with all Q&A pairs
    const systemPrompt = `You are a helpful assistant that matches user questions to FAQs.
You understand semantic meaning, intent, and can handle typos, rephrasing, and colloquial language.
Be generous in matching - if the user is clearly asking about a topic covered in the FAQs, match it.`

    const userPrompt = `Find the best matching FAQ for this user question.
User asks: "${userQuestion}"

Available FAQs:
${faqList.map(faq =>
  `${faq.num}. Q: ${faq.question}
   A: ${faq.answer}`
).join('\n\n')}${knowledgeContext}

Instructions:
- If there's a good match, provide your response in this exact format:
  MATCH:NUMBER
  NATURAL:Your natural, conversational version of the answer (2-3 sentences max, suitable for voice)
- If there's a partial/uncertain match, use:
  PARTIAL:NUMBER
  NATURAL:Your natural version of the answer
- If the question is about Dr. Huberman's background, education, research, or achievements AND no specific FAQ matches:
  Use the Additional Context to provide a comprehensive answer with format:
  CONTEXT
  NATURAL:Your natural answer based on the context (2-3 sentences max)
- If no relevant match exists and it's not about Dr. Huberman, respond with just "none"
- Consider intent and meaning, not just exact words
- Make the natural answer sound friendly and conversational for voice output
- Keep core facts accurate but rephrase for natural speech`

    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Low but allows some natural variation
      max_tokens: 200 // Need more for natural answer
    })

    const response = completion.choices[0].message.content?.trim() || 'none'
    console.log(`🤖 AI matcher response: ${response.substring(0, 100)}...`)

    // Parse the response
    if (response.toLowerCase() === 'none') {
      // Generate a natural decline message
      return await generateNaturalDecline(userQuestion)
    }

    // Parse the structured response
    const lines = response.split('\n')
    const matchLine = lines[0]?.toUpperCase() || ''
    const naturalLine = lines[1] || ''

    let matchNum: number
    let confidence: 'high' | 'medium' | 'low' = 'high'
    let naturalAnswer = ''

    // Check if it's a context-based response (for biographical questions)
    if (matchLine === 'CONTEXT') {
      // Extract natural answer from context response
      if (naturalLine.toUpperCase().startsWith('NATURAL:')) {
        naturalAnswer = naturalLine.replace(/^NATURAL:/i, '').trim()
      }

      // Return as a special biographical response
      return {
        question: userQuestion,
        answer: naturalAnswer,
        naturalAnswer: naturalAnswer,
        category: 'About Dr. Huberman',
        confidence: 'high'
      }
    }

    // Extract match number and natural answer
    if (matchLine.startsWith('MATCH:')) {
      matchNum = parseInt(matchLine.replace('MATCH:', '').trim())
      confidence = 'high'
    } else if (matchLine.startsWith('PARTIAL:')) {
      matchNum = parseInt(matchLine.replace('PARTIAL:', '').trim())
      confidence = 'medium'
    } else {
      // Fallback for simple number response
      matchNum = parseInt(response)
      naturalAnswer = '' // Will use original answer
    }

    // Extract natural answer if provided
    if (naturalLine.toUpperCase().startsWith('NATURAL:')) {
      naturalAnswer = naturalLine.replace(/^NATURAL:/i, '').trim()
    }

    // Validate the number
    if (isNaN(matchNum) || matchNum < 1 || matchNum > faqList.length) {
      console.error(`Invalid AI response: ${response}`)
      return null
    }

    // Return the matched FAQ with natural answer
    const matched = faqList[matchNum - 1]
    return {
      question: matched.question,
      answer: matched.answer,
      naturalAnswer: naturalAnswer || matched.answer, // Fallback to original
      category: matched.category,
      confidence
    }

  } catch (error) {
    console.error('AI FAQ matching failed:', error)
    return null
  }
}

/**
 * Generate a natural decline message when no FAQ matches
 */
async function generateNaturalDecline(userQuestion: string): Promise<NoMatchResponse> {
  try {
    const systemPrompt = `You are a helpful assistant for the Huberman Lab podcast website.
The user asked a question that doesn't match any of our FAQs.
Generate a natural, friendly decline that:
1. Acknowledges their specific question topic
2. Explains we can only help with Huberman Lab podcast information
3. Suggests relevant topics we CAN help with (podcast, premium membership, newsletter, events)
4. Keeps it concise (2 sentences max)
5. Sounds natural for voice/speech output`

    const userPrompt = `User asked: "${userQuestion}"

Generate a natural decline response that sounds conversational.`

    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4, // Some creativity for natural responses
      max_tokens: 100
    })

    const naturalResponse = completion.choices[0].message.content?.trim() ||
      "I don't have specific information about that. Is there something else about Huberman Lab I can help you with?"

    return {
      type: 'no_match',
      response: naturalResponse
    }
  } catch (error) {
    console.error('Failed to generate natural decline:', error)
    // Fallback to generic decline
    return {
      type: 'no_match',
      response: "I don't have specific information about that. Is there something else about Huberman Lab I can help you with?"
    }
  }
}

/**
 * Pre-validate that FAQs are loaded correctly
 */
export function validateFAQData(): { isValid: boolean; totalQuestions: number; categories: number } {
  let totalQuestions = 0
  let categories = 0

  try {
    categories = faqData.categories.length
    for (const category of faqData.categories) {
      totalQuestions += category.questions.length
    }

    return {
      isValid: totalQuestions > 0,
      totalQuestions,
      categories
    }
  } catch (error) {
    console.error('Failed to validate FAQ data:', error)
    return { isValid: false, totalQuestions: 0, categories: 0 }
  }
}