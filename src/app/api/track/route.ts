import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create Supabase client with service key for fast inserts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const sessionId = body.session_id || 'unknown'

    // Check if session exists, if not create it (fire and forget)
    supabase
      .from('conversation_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .single()
      .then(async ({ data: session, error }) => {
        if (error || !session) {
          // Create new session
          await supabase
            .from('conversation_sessions')
            .insert({
              session_id: sessionId,
              total_questions: 1,
              matched_questions: body.matched ? 1 : 0
            })
        } else {
          // Update existing session counts
          const { data: current } = await supabase
            .from('conversation_sessions')
            .select('total_questions, matched_questions')
            .eq('session_id', sessionId)
            .single()

          if (current) {
            await supabase
              .from('conversation_sessions')
              .update({
                total_questions: (current.total_questions || 0) + 1,
                matched_questions: (current.matched_questions || 0) + (body.matched ? 1 : 0),
                ended_at: new Date().toISOString()
              })
              .eq('session_id', sessionId)
          }
        }
      })

    // Insert the message
    supabase
      .from('conversation_messages')
      .insert({
        session_id: sessionId,
        question: body.question || '',
        matched: body.matched || false,
        category: body.category || null
      })
      .then(({ error }) => {
        if (error) {
          console.error('Track message error:', error)
        }
      })

    // Return immediately for speed
    return NextResponse.json({ success: true })
  } catch (error) {
    // Don't let tracking errors affect the widget
    return NextResponse.json({ success: true })
  }
}

// Allow CORS for widget
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}