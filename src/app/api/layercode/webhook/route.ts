import { streamResponse } from '@layercode/node-server-sdk'
import { matchFAQWithAI, type FAQMatch, type NoMatchResponse } from '@/lib/faq-ai-matcher'
import { extractURLsFromAnswer } from '@/lib/url-extractor'

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
          stream.tts("Hello! I'm your Huberman Lab assistant. I can help with questions about the podcast, premium membership, newsletter, events, merchandise, and episode schedules. How can I help you today?")
          stream.end()
          return
        }

        if (type === 'session.end' || type === 'session.update') {
          // Just acknowledge session end/update events
          stream.end()
          return
        }

        if (type === 'message' && text) {
          // Use AI to match with FAQ
          const result = await matchFAQWithAI(text)

          if (result) {
            if ('type' in result && result.type === 'no_match') {
              // AI generated a natural decline message
              stream.tts(result.response)

              // Send metadata about no match
              stream.data({
                type: 'no_match',
                question: text,
                response: result.response,
                urls: { hasLinks: false, links: [] }
              })
            } else {
              // We have a FAQ match - stream the natural answer
              const faqMatch = result as FAQMatch // Type assertion
              stream.tts(faqMatch.naturalAnswer)

              // Extract URLs from the original answer
              const urlData = extractURLsFromAnswer(faqMatch.answer)

              // Send metadata about the FAQ match with URL data
              stream.data({
                type: 'faq_match',
                question: faqMatch.question,
                answer: faqMatch.naturalAnswer,
                originalAnswer: faqMatch.answer,
                confidence: faqMatch.confidence,
                category: faqMatch.category,
                urls: urlData
              })

              // If it's a medium confidence match, add a follow-up
              if (faqMatch.confidence === 'medium') {
                stream.tts(" Was that what you were looking for?")
              }
            }
          } else {
            // Fallback if something went wrong
            const fallbackDecline = "I'm sorry, I don't have specific information about that. Is there something else about Huberman Lab I can help you with?"
            stream.tts(fallbackDecline)

            stream.data({
              type: 'no_match',
              question: text,
              response: fallbackDecline,
              urls: { hasLinks: false, links: [] }
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