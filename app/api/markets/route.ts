import { NextResponse } from 'next/server'
import { fetchIranEvents, processEvents } from '@/lib/api'
import { translateTitle } from '@/lib/translate'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const events = await fetchIranEvents()
    const markets = processEvents(events)
    const translated = markets.map(m => ({
      ...m,
      translatedQuestion: translateTitle(m.question),
      translatedEventTitle: translateTitle(m.eventTitle),
    }))
    return NextResponse.json(translated, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
