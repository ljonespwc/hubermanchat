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

    // Fire and forget - don't await for speed
    const insertPromise = supabase
      .from('conversations')
      .insert({
        session_id: body.session_id || 'unknown',
        question: body.question || '',
        matched: body.matched || false,
        category: body.category || null
      })

    // Handle errors without blocking
    insertPromise.then(({ error }) => {
      if (error) {
        console.error('Track error:', error)
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