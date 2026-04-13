import { fetchIranEvents, processEvents } from '@/lib/api'
import { translateTitle } from '@/lib/translate'
import MarketsTable from '@/components/MarketsTable'

export const revalidate = 1800

export default async function Home() {
  const events = await fetchIranEvents()
  const markets = processEvents(events)

  // Apply translations
  const translatedMarkets = markets.map(m => ({
    ...m,
    translatedQuestion: translateTitle(m.question),
    translatedEventTitle: translateTitle(m.eventTitle),
  }))

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">伊朗预测市场追踪</h1>
          <p className="text-gray-400 text-sm">
            数据来源：Polymarket · 每30分钟更新 · 共 {translatedMarkets.length} 个活跃市场
          </p>
        </div>

        <MarketsTable markets={translatedMarkets} />
      </div>
    </main>
  )
}
