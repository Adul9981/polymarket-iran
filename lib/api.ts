export interface GammaMarket {
  id: string
  question: string
  slug: string
  endDate: string
  liquidity: number
  startDate: string
  outcomes: string
  outcomePrices: string
  volume: number
  volume24hr?: number
  active: boolean
  closed: boolean
}

export interface GammaEvent {
  id: string
  title: string
  slug: string
  description: string
  startDate: string
  endDate: string
  active: boolean
  closed: boolean
  archived: boolean
  volume: number
  volume24hr: number
  liquidity: number
  markets: GammaMarket[]
  tags?: Array<{ slug: string; label: string }>
}

export interface ProcessedMarket {
  eventId: string
  eventTitle: string
  eventSlug: string
  marketId: string
  question: string
  translatedQuestion: string
  yesPrice: number
  noPrice: number
  yesReturn: number
  noReturn: number
  bestReturn: number
  bestDirection: 'YES' | 'NO'
  liquidity: number
  volume: number
  volume24hr: number
  endDate: string
  daysLeft: number
  link: string
}

export async function fetchIranEvents(): Promise<GammaEvent[]> {
  const url = `https://gamma-api.polymarket.com/events?active=true&closed=false&archived=false&tag_slug=iran&limit=100&order=volume24hr&ascending=false`
  const res = await fetch(url, { next: { revalidate: 1800 } })
  if (!res.ok) return []
  const data = await res.json()
  return data
}

export function calculateReturns(yesPrice: number): {
  yesReturn: number
  noReturn: number
  bestReturn: number
  bestDirection: 'YES' | 'NO'
} {
  if (yesPrice <= 0 || yesPrice >= 1) {
    return { yesReturn: 0, noReturn: 0, bestReturn: 0, bestDirection: 'YES' }
  }
  const yesReturn = ((1 - yesPrice) / yesPrice) * 100
  const noReturn = (yesPrice / (1 - yesPrice)) * 100
  const bestReturn = Math.max(yesReturn, noReturn)
  const bestDirection = yesReturn >= noReturn ? 'YES' : 'NO'
  return { yesReturn, noReturn, bestReturn, bestDirection }
}

export function getDaysLeft(endDate: string): number {
  const now = Date.now()
  const end = new Date(endDate).getTime()
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
}

export function processEvents(events: GammaEvent[]): ProcessedMarket[] {
  const results: ProcessedMarket[] = []
  const now = Date.now()

  for (const event of events) {
    if (!event.markets || event.markets.length === 0) continue

    for (const market of event.markets) {
      if (!market.active || market.closed) continue
      if (!market.outcomePrices || !market.outcomes) continue

      const endDateStr = market.endDate || event.endDate
      if (!endDateStr) continue
      const endTime = new Date(endDateStr).getTime()
      if (endTime <= now) continue

      let prices: number[]
      try {
        prices = JSON.parse(market.outcomePrices).map(Number)
      } catch {
        continue
      }

      const yesPrice = prices[0]
      if (!yesPrice || yesPrice <= 0 || yesPrice >= 1) continue

      const { yesReturn, noReturn, bestReturn, bestDirection } = calculateReturns(yesPrice)
      const daysLeft = getDaysLeft(endDateStr)
      const link = `https://polymarket.com/event/${event.slug}?via=serene77mc-g6kj`

      results.push({
        eventId: event.id,
        eventTitle: event.title,
        eventSlug: event.slug,
        marketId: market.id,
        question: market.question,
        translatedQuestion: market.question, // will be replaced by translate
        yesPrice,
        noPrice: 1 - yesPrice,
        yesReturn,
        noReturn,
        bestReturn,
        bestDirection,
        liquidity: market.liquidity || 0,
        volume: market.volume || 0,
        volume24hr: market.volume24hr || event.volume24hr || 0,
        endDate: endDateStr,
        daysLeft,
        link,
      })
    }
  }

  return results
}
