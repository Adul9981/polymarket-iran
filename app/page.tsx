import MarketsTable from '@/components/MarketsTable'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            伊朗预测市场追踪
          </h1>
          <p className="text-gray-400 text-sm">
            数据来源：Polymarket · 实时刷新 · 仅显示活跃市场
          </p>
        </div>
        <MarketsTable />
      </div>
    </main>
  )
}
