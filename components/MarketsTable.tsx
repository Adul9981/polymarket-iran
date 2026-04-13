'use client'

import { Fragment, useState, useMemo } from 'react'
import { ProcessedMarket } from '@/lib/api'

interface Props {
  markets: (ProcessedMarket & { translatedEventTitle: string })[]
}

function ReturnBadge({ value }: { value: number }) {
  const pct = Math.round(value)
  let cls = ''
  if (pct >= 500) cls = 'bg-green-600 text-white font-bold'
  else if (pct >= 200) cls = 'bg-green-500 text-white font-semibold'
  else if (pct >= 100) cls = 'bg-green-300 text-green-900 font-medium'
  else cls = 'bg-gray-700 text-gray-300'

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-sm ${cls}`}>
      {pct >= 1000 ? `${(pct / 100).toFixed(0)}倍` : `${pct}%`}
    </span>
  )
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n)}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function DaysLeftBadge({ days }: { days: number }) {
  let cls = 'text-gray-400'
  if (days <= 7) cls = 'text-red-400 font-semibold'
  else if (days <= 30) cls = 'text-yellow-400'
  else if (days <= 90) cls = 'text-blue-400'
  return <span className={cls}>{days}天后</span>
}

type SortKey = 'bestReturn' | 'liquidity' | 'volume' | 'daysLeft'

export default function MarketsTable({ markets }: Props) {
  const [timeRange, setTimeRange] = useState<'all' | '7' | '30' | '90'>('all')
  const [minLiquidity, setMinLiquidity] = useState(0)
  const [minReturn, setMinReturn] = useState(0)
  const [sortKey, setSortKey] = useState<SortKey>('bestReturn')
  const [sortAsc, setSortAsc] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    return markets.filter(m => {
      if (timeRange !== 'all' && m.daysLeft > parseInt(timeRange)) return false
      if (m.liquidity < minLiquidity) return false
      if (m.bestReturn < minReturn) return false
      return true
    })
  }, [markets, timeRange, minLiquidity, minReturn])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      return sortAsc ? av - bv : bv - av
    })
  }, [filtered, sortKey, sortAsc])

  // Group by event
  const groups = useMemo(() => {
    const map = new Map<string, typeof sorted>()
    for (const m of sorted) {
      if (!map.has(m.eventId)) map.set(m.eventId, [])
      map.get(m.eventId)!.push(m)
    }
    return Array.from(map.entries())
  }, [sorted])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  function toggleGroup(eventId: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(eventId)) next.delete(eventId)
      else next.add(eventId)
      return next
    })
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-gray-600 ml-1">↕</span>
    return <span className="text-green-400 ml-1">{sortAsc ? '↑' : '↓'}</span>
  }

  const filterBtn = (active: boolean) =>
    `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
      active ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
    }`

  return (
    <div>
      {/* Filters */}
      <div className="bg-gray-900 rounded-xl p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-6">
          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">截止时间</div>
            <div className="flex gap-2">
              {(
                [
                  ['all', '全部'],
                  ['7', '7天内'],
                  ['30', '1个月内'],
                  ['90', '3个月内'],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setTimeRange(v)}
                  className={filterBtn(timeRange === v)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">最低流动性</div>
            <div className="flex gap-2">
              {(
                [
                  [0, '不限'],
                  [1000, '$1K'],
                  [5000, '$5K'],
                  [10000, '$10K'],
                ] as [number, string][]
              ).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setMinLiquidity(v)}
                  className={filterBtn(minLiquidity === v)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">最低回报率</div>
            <div className="flex gap-2">
              {(
                [
                  [0, '不限'],
                  [50, '>50%'],
                  [100, '>100%'],
                  [300, '>300%'],
                ] as [number, string][]
              ).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setMinReturn(v)}
                  className={filterBtn(minReturn === v)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 pt-1">
          当前显示 {sorted.length} 个市场，共 {groups.length} 个事件组
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3 w-8"></th>
              <th className="text-left px-4 py-3">市场问题</th>
              <th
                className="text-right px-4 py-3 cursor-pointer hover:text-green-400 whitespace-nowrap"
                onClick={() => toggleSort('bestReturn')}
              >
                最优回报率 <SortIcon col="bestReturn" />
              </th>
              <th className="text-right px-4 py-3 whitespace-nowrap">方向</th>
              <th className="text-right px-4 py-3 whitespace-nowrap">隐含概率</th>
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
                总交易量 <SortIcon col="volume" />
              </th>
              <th
                className="text-right px-4 py-3 cursor-pointer hover:text-green-400 whitespace-nowrap"
                onClick={() => toggleSort('daysLeft')}
              >
                截止日期 <SortIcon col="daysLeft" />
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {groups.map(([eventId, groupMarkets]) => {
              const first = groupMarkets[0]
              const collapsed = collapsedGroups.has(eventId)
              const groupBestReturn = Math.max(...groupMarkets.map(m => m.bestReturn))

              return (
                <Fragment key={eventId}>
                  {/* Group header row */}
                  <tr
                    onClick={() => toggleGroup(eventId)}
                    className="bg-gray-800/60 hover:bg-gray-800 cursor-pointer border-t border-gray-700"
                  >
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{collapsed ? '▶' : '▼'}</td>
                    <td className="px-4 py-2.5" colSpan={7}>
                      <span className="font-semibold text-gray-200">
                        {first.translatedEventTitle}
                      </span>
                      <span className="ml-3 text-xs text-gray-500">{groupMarkets.length} 个市场</span>
                      <span className="ml-3 text-xs text-green-400">
                        最高 {Math.round(groupBestReturn)}% 回报
                      </span>
                    </td>
                    <td className="px-4 py-2.5"></td>
                  </tr>
                  {/* Market rows */}
                  {!collapsed &&
                    groupMarkets.map(m => (
                      <tr
                        key={m.marketId}
                        className="border-t border-gray-800/50 hover:bg-gray-800/30"
                      >
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-gray-200 max-w-xs">
                          <span className="text-gray-400 text-xs mr-1">└</span>
                          {m.translatedQuestion}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ReturnBadge value={m.bestReturn} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                              m.bestDirection === 'YES'
                                ? 'bg-blue-900/50 text-blue-300'
                                : 'bg-orange-900/50 text-orange-300'
                            }`}
                          >
                            {m.bestDirection === 'YES' ? '买YES' : '买NO'}
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
                          <div className="text-gray-300">{formatDate(m.endDate)}</div>
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
                  暂无符合条件的市场
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-600">
        数据来自{' '}
        <a
          href="https://polymarket.com/?r=serene77mc-g6kj"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-400"
        >
          Polymarket
        </a>{' '}
        · 回报率为理论最大值，不构成投资建议
      </div>
    </div>
  )
}
