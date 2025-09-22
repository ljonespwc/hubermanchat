import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Get total sessions
    const { count: total } = await supabase
      .from('conversation_sessions')
      .select('*', { count: 'exact', head: true })

    // Get today's sessions
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: todayCount } = await supabase
      .from('conversation_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Get match rate from messages
    const { data: messages } = await supabase
      .from('conversation_messages')
      .select('matched')

    const matchedCount = messages?.filter(m => m.matched).length || 0
    const totalMessages = messages?.length || 1
    const matchRate = Math.round((matchedCount / totalMessages) * 100)

    // Get active sessions (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const { count: activeNow } = await supabase
      .from('conversation_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('ended_at', fiveMinutesAgo.toISOString())

    // Get recent sessions with their messages (last 10 sessions)
    const { data: recentSessions } = await supabase
      .from('conversation_sessions')
      .select(`
        id,
        session_id,
        started_at,
        ended_at,
        total_questions,
        matched_questions,
        messages:conversation_messages(
          id,
          question,
          matched,
          category,
          created_at
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      total: total || 0,
      today: todayCount || 0,
      matchRate,
      activeNow: activeNow || 0,
      recentSessions: recentSessions || []
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({
      total: 0,
      today: 0,
      matchRate: 0,
      activeNow: 0,
      recentSessions: []
    })
  }
}