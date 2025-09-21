import { streamResponse } from '@layercode/node-server-sdk'
import { OpenAI } from 'openai'
import { matchFAQEnhanced } from '@/lib/faq-matcher-enhanced'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const requestBody = await request.json()

    // Verify webhook secret if configured
    const webhookSecret = process.env.LAYERCODE_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get('x-layercode-signature')
      // TODO: Implement signature verification if needed
    }

    // Handle different webhook event types
    const { type, text, turn_id, session_id, conversation_id } = requestBody

    return streamResponse(requestBody, async ({ stream }) => {
      try {
        if (type === 'session.start') {
          // Send a welcome message when the session starts
          stream.tts("Hello! I'm your Huberman Lab assistant. How can I help you today?")
          stream.end()
          return
        }

        if (type === 'session.end' || type === 'session.update') {
          // Just acknowledge session end/update events
          stream.end()
          return
        }

        if (type === 'message' && text) {
          // First, try to match with FAQ using enhanced matcher
          const faqMatch = await matchFAQEnhanced(text)

          if (faqMatch) {
            // High confidence FAQ match - but make it conversational
            // Use OpenAI to make the FAQ answer sound more natural
            const systemPrompt = `You are speaking as a friendly assistant for the Huberman Lab podcast.
Your task is to make this FAQ answer sound natural and conversational for voice output.
Keep the core information accurate but make it sound like natural speech.
Be concise - aim for 2-3 sentences max.
Do not add any information not present in the original answer.

Original FAQ answer to rephrase:
"${faqMatch.answer}"`

            try {
              const completion = await openai.chat.completions.create({
                model: 'gpt-4.1-mini',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: 'Make this sound natural for voice.' }
                ],
                temperature: 0.3, // Low creativity - stay close to source
                max_tokens: 150
              })

              const naturalAnswer = completion.choices[0].message.content || faqMatch.answer
              stream.tts(naturalAnswer)

              // Send metadata about the FAQ match
              stream.data({
                type: 'faq_match',
                question: faqMatch.question,
                answer: naturalAnswer,
                originalAnswer: faqMatch.answer,
                confidence: faqMatch.confidence,
                category: faqMatch.category,
                matchType: faqMatch.matchType
              })
            } catch (error) {
              // Fallback to original answer if OpenAI fails
              console.error('Failed to make answer conversational:', error)
              stream.tts(faqMatch.answer)
            }
          } else {
            // No FAQ match - politely decline to answer
            const politeDecline = "I'm sorry, I don't have specific information about that. I can only help with questions about the Huberman Lab podcast, premium membership, newsletter, and events. Is there something else about Huberman Lab I can help you with?"

            stream.tts(politeDecline)

            // Send metadata about no match
            stream.data({
              type: 'no_match',
              question: text,
              response: politeDecline
            })
          }
        }

        stream.end()
      } catch (error) {
        console.error('Error in webhook handler:', error)
        stream.tts("I apologize, but I encountered an error processing your request. Please try again.")
        stream.end()
      }
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}