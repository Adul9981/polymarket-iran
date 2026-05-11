'use client'

import { Fragment, useState, useMemo, useEffect, useCallback } from 'react'
import type { ProcessedMarket } from '@/lib/api'

type Market = ProcessedMarket & { translatedEventTitle: string }

// ── 回报率徽章 ──────────────────────────────────────────────
function ReturnBadge({ value }: { value: number }) {
  const pct = Math.round(value)
  let cls = ''
  if (pct >= 500)      cls = 'bg-green-700 text-white font-bold'
  else if (pct >= 200) cls = 'bg-green-500 text-white font-semibold'
  else if (pct >= 100) cls = 'bg-green-300 text-green-900 font-medium'
  else                 cls = 'bg-gray-700 text-gray-300'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-sm ${cls}`}>
      {pct >= 1000 ? `${(pct / 100).toFixed(0)}倍` : `${pct}%`}
    </span>
  )
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n)}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function DaysLeftBadge({ days }: { days: number }) {
  let cls = 'text-gray-400'
  if (days <= 7)       cls = 'text-red-400 font-semibold'
  else if (days <= 30) cls = 'text-yellow-400'
  else if (days <= 90) cls = 'text-blue-400'
  return <span className={cls}>{days}天</span>
}

type SortKey = 'bestReturn' | 'liquidity' | 'volume' | 'daysLeft'

// ── 主组件 ─────────────────────────────────────────────────
export default function MarketsTable() {
  const [markets, setMarkets]       = useState<Market[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [timeRange, setTimeRange]   = useState<'all' | '7' | '30' | '90'>('all')
  const [minLiquidity, setMinLiq]   = useState(0)
  const [minReturn, setMinReturn]   = useState(0)
  const [sortKey, setSortKey]       = useState<SortKey>('bestReturn')
  const [sortAsc, setSortAsc]       = useState(false)
  const [collapsed, setCollapsed]   = useState<Set<string>>(new Set())

  // ── 拉取数据 ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setError(false)
      const res = await fetch('/api/markets', { cache: 'no-store' })
      if (!res.ok) throw new Error('fetch failed')
      const data: Market[] = await res.json()
      // 客户端用当前时间再次过滤，确保已到期的不显示
      const now = Date.now()
      const fresh = data.filter(m => new Date(m.endDate).getTime() > now)
      setMarkets(fresh)
      setLastUpdated(new Date())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // 每 5 分钟自动刷新
    const timer = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [fetchData])

  // ── 过滤 + 排序 ──────────────────────────────────────────
  const filtered = useMemo(() => {
    return markets.filter(m => {
      if (timeRange !== 'all' && m.daysLeft > parseInt(timeRange)) return false
      if (m.liquidity < minLiquidity) return false
      if (m.bestReturn < minReturn)   return false
      return true
    })
  }, [markets, timeRange, minLiquidity, minReturn])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      return sortAsc ? av - bv : bv - av
    })
  }, [filtered, sortKey, sortAsc])

  // 按父事件分组
  const groups = useMemo(() => {
    const map = new Map<string, Market[]>()
    for (const m of sorted) {
      if (!map.has(m.eventId)) map.set(m.eventId, [])
      map.get(m.eventId)!.push(m)
    }
    return Array.from(map.entries())
  }, [sorted])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(v => !v)
    else { setSortKey(key); setSortAsc(false) }
  }

  function toggleGroup(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-gray-600 ml-1">↕</span>
    return <span className="text-green-400 ml-1">{sortAsc ? '↑' : '↓'}</span>
  }

  const btn = (active: boolean) =>
    `px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer ${
      active
        ? 'bg-green-600 text-white'
        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
    }`

  // ── 状态 UI ──────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-32 text-gray-500">
      <svg className="animate-spin h-6 w-6 mr-3 text-green-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      正在加载伊朗预测市场数据…
    </div>
  )

  if (error) return (
    <div className="text-center py-32">
      <p className="text-red-400 mb-4">数据加载失败，请检查网络</p>
      <button onClick={fetchData} className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 text-sm">
        重新加载
      </button>
    </div>
  )

  return (
    <div>
      {/* ── 筛选栏 ── */}
      <div className="bg-gray-900 rounded-xl p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-6">
          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">截止时间</div>
            <div className="flex gap-2">
              {([['all','全部'],['7','7天内'],['30','1个月内'],['90','3个月内']] as const).map(([v,l]) => (
                <button key={v} onClick={() => setTimeRange(v)} className={btn(timeRange === v)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">最低流动性</div>
            <div className="flex gap-2">
              {([[0,'不限'],[1000,'$1K'],[5000,'$5K'],[10000,'$10K']] as [number,string][]).map(([v,l]) => (
                <button key={v} onClick={() => setMinLiq(v)} className={btn(minLiquidity === v)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">最低回报率</div>
            <div className="flex gap-2">
              {([[0,'不限'],[50,'>50%'],[100,'>100%'],[300,'>300%']] as [number,string][]).map(([v,l]) => (
                <button key={v} onClick={() => setMinReturn(v)} className={btn(minReturn === v)}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* 状态栏 */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-500">
            显示 {sorted.length} 个市场 · {groups.length} 个事件组
          </span>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-600">
                更新于 {lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={fetchData}
              className="text-xs text-green-500 hover:text-green-400 flex items-center gap-1 cursor-pointer"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* ── 表格 ── */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3 w-6"></th>
              <th className="text-left px-4 py-3">市场问题</th>
              <th
                className="text-right px-4 py-3 cursor-pointer hover:text-green-400 whitespace-nowrap"
                onClick={() => toggleSort('bestReturn')}
              >
                最优回报率 <SortIcon col="bestReturn" />
              </th>
              <th className="text-right px-4 py-3 whitespace-nowrap">方向</th>
              <th className="text-right px-4 py-3 whitespace-nowrap">概率</th>
              <th
                className="text-right px-4 py-3 cursor-pointer hover:text-green-400 whitespace-nowrap"
                onClick={() => toggleSort('liquidity')}
              >
                流动性 <SortIcon col="liquidity" />
              </th>
              <th
                className="text-right px-4 py-3 cursor-pointer hover:text-green-400 whitespace-nowrap"
                onClick={() => toggleSort('volume')}
              >
                交易量 <SortIcon col="volume" />
              </th>
              <th
                className="text-right px-4 py-3 cursor-pointer hover:text-green-400 whitespace-nowrap"
                onClick={() => toggleSort('daysLeft')}
              >
                截止 <SortIcon col="daysLeft" />
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {groups.map(([eventId, gMarkets]) => {
              const first = gMarkets[0]
              const isCollapsed = collapsed.has(eventId)
              const groupBest = Math.max(...gMarkets.map(m => m.bestReturn))

              return (
                <Fragment key={eventId}>
                  {/* 事件组标题行 */}
                  <tr
                    onClick={() => toggleGroup(eventId)}
                    className="bg-gray-800/60 hover:bg-gray-800 cursor-pointer border-t border-gray-700"
                  >
                    <td className="px-4 py-2.5 text-gray-400 text-xs">
                      {isCollapsed ? '▶' : '▼'}
                    </td>
                    <td className="px-4 py-2.5" colSpan={7}>
                      <span className="font-semibold text-gray-200">
                        {first.translatedEventTitle}
                      </span>
                      <span className="ml-3 text-xs text-gray-500">
                        {gMarkets.length} 个市场
                      </span>
                      <span className="ml-3 text-xs text-green-400">
                        最高 {Math.round(groupBest)}% 回报
                      </span>
                    </td>
                    <td className="px-4 py-2.5"></td>
                  </tr>

                  {/* 市场明细行 */}
                  {!isCollapsed && gMarkets.map(m => (
                    <tr key={m.marketId} className="border-t border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-gray-200 max-w-xs">
                        <span className="text-gray-500 text-xs mr-1">└</span>
                        {m.translatedQuestion}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ReturnBadge value={m.bestReturn} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                          m.bestDirection === 'YES'
                            ? 'bg-blue-900/50 text-blue-300'
                            : 'bg-orange-900/50 text-orange-300'
                        }`}>
                          买{m.bestDirection === 'YES' ? 'YES' : 'NO'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {Math.round(m.yesPrice * 100)}%
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {formatMoney(m.liquidity)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {formatMoney(m.volume)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-gray-300 text-xs">{formatDate(m.endDate)}</div>
                        <DaysLeftBadge days={m.daysLeft} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={m.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300 text-xs underline"
                        >
                          交易 →
                        </a>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              )
            })}
            {groups.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-16 text-gray-500">
                  暂无符合条件的活跃市场
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 底部 */}
      <div className="mt-6 text-center text-xs text-gray-600">
        数据来自{' '}
        <a href="https://polymarket.com/?r=serene77mc-g6kj" target="_blank" rel="noopener noreferrer"
          className="hover:text-gray-400">Polymarket</a>
        {' '}· 每5分钟自动刷新 · 回报率为理论最大值，不构成投资建议
      </div>
    </div>
  )
}
