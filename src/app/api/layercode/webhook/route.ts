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
            // High confidence FAQ match - stream the answer directly
            stream.tts(faqMatch.answer)

            // Send additional data to frontend for UI updates
            stream.data({
              type: 'faq_match',
              question: faqMatch.question,
              answer: faqMatch.answer,
              confidence: faqMatch.confidence,
              category: faqMatch.category,
              matchType: faqMatch.matchType // 'embedding' or 'keyword'
            })
          } else {
            // No good FAQ match - use OpenAI with streaming
            const systemPrompt = `You are a helpful assistant for the Huberman Lab podcast and website.
            You help visitors find information about the podcast, premium membership, newsletter, events, and other related topics.
            Keep your responses concise, friendly, and informative.
            If you don't know something specific about Huberman Lab, be honest about it.`

            // Create a streaming completion
            const completion = await openai.chat.completions.create({
              model: 'gpt-4.1-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text }
              ],
              stream: true,
              temperature: 0.7,
              max_tokens: 200
            })

            // Buffer to accumulate sentences for TTS
            let buffer = ''

            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content || ''
              buffer += content

              // Stream complete sentences to TTS for natural speech
              const sentences = buffer.match(/[^.!?]+[.!?]+/g) || []
              if (sentences.length > 0) {
                // Keep the last incomplete sentence in the buffer
                const lastChar = buffer[buffer.length - 1]
                if (['.', '!', '?'].includes(lastChar)) {
                  // Buffer ends with punctuation, send all
                  stream.tts(buffer)
                  buffer = ''
                } else {
                  // Send complete sentences, keep the incomplete part
                  const completeSentences = sentences.slice(0, -1)
                  if (completeSentences.length > 0) {
                    stream.tts(completeSentences.join(' '))
                    buffer = sentences[sentences.length - 1]
                  }
                }
              }
            }

            // Send any remaining text in the buffer
            if (buffer.trim()) {
              stream.tts(buffer)
            }

            // Send metadata about the AI response
            stream.data({
              type: 'ai_response',
              model: 'gpt-4.1-mini',
              question: text
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