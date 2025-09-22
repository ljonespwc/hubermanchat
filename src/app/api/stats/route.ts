import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Get total conversations
    const { count: total } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })

    // Get today's conversations
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: todayCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Get match rate
    const { data: matchData } = await supabase
      .from('conversations')
      .select('matched')

    const matchedCount = matchData?.filter(c => c.matched).length || 0
    const totalWithData = matchData?.length || 1
    const matchRate = Math.round((matchedCount / totalWithData) * 100)

    // Get active now (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const { count: activeNow } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fiveMinutesAgo.toISOString())

    // Get recent conversations (last 20)
    const { data: recentConversations } = await supabase
      .from('conversations')
      .select('id, question, matched, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      total: total || 0,
      today: todayCount || 0,
      matchRate,
      activeNow: activeNow || 0,
      recentConversations: recentConversations || []
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({
      total: 0,
      today: 0,
      matchRate: 0,
      activeNow: 0,
      recentConversations: []
    })
  }
}