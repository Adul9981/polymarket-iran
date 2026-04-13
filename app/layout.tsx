import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '伊朗预测市场追踪 | Polymarket',
  description: '实时追踪 Polymarket 伊朗相关预测市场回报率、流动性和截止日期',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className="antialiased">{children}</body>
    </html>
  )
}
