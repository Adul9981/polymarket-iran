// Translates English Polymarket market questions to Chinese
// Handles common patterns, dates, and Iran-specific terminology

const MONTH_MAP: Record<string, string> = {
  january: '1', february: '2', march: '3', april: '4',
  may: '5', june: '6', july: '7', august: '8',
  september: '9', october: '10', november: '11', december: '12',
  jan: '1', feb: '2', mar: '3', apr: '4',
  jun: '6', jul: '7', aug: '8',
  sep: '9', oct: '10', nov: '11', dec: '12',
}

// Format: "April 15, 2025" or "April 15" or "April 15th" -> "4月15日"
function translateDate(text: string): string {
  return text.replace(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?\b/gi,
    (_, month, day, year) => {
      const m = MONTH_MAP[month.toLowerCase()]
      return year ? `${year}年${m}月${day}日` : `${m}月${day}日`
    }
  )
}

const PHRASE_MAP: [RegExp, string | ((m: string) => string)][] = [
  // Question starters
  [/^will\s+/i, ''],
  [/\?$/, '？'],

  // Common actions
  [/\battack\b/gi, '袭击'],
  [/\bstrike\b/gi, '打击'],
  [/\binvade\b/gi, '入侵'],
  [/\blaunch\b/gi, '发动'],
  [/\bfire\b/gi, '开火'],
  [/\bbomb\b/gi, '轰炸'],
  [/\bdetonate\b/gi, '引爆'],
  [/\btest\b/gi, '测试'],
  [/\buse\b/gi, '使用'],
  [/\bdeploy\b/gi, '部署'],
  [/\bgain\b/gi, '获得'],
  [/\bacquire\b/gi, '获取'],
  [/\bdevelop\b/gi, '研发'],
  [/\bbuild\b/gi, '建造'],
  [/\bcreate\b/gi, '创建'],
  [/\bsign\b/gi, '签署'],
  [/\breach\b/gi, '达成'],
  [/\bagree\b/gi, '同意'],
  [/\bapprove\b/gi, '批准'],
  [/\bwithdraw\b/gi, '撤军'],
  [/\bimpose\b/gi, '施加'],
  [/\bsanction\b/gi, '制裁'],
  [/\bsanctions\b/gi, '制裁'],
  [/\bnegotiate\b/gi, '谈判'],
  [/\bnegotiations?\b/gi, '谈判'],
  [/\bceasefire\b/gi, '停火'],
  [/\bwar\b/gi, '战争'],
  [/\bconflict\b/gi, '冲突'],
  [/\bcrisis\b/gi, '危机'],
  [/\bdeal\b/gi, '协议'],
  [/\bagreement\b/gi, '协议'],
  [/\btruce\b/gi, '停战'],
  [/\bescalate\b/gi, '升级'],
  [/\bescalation\b/gi, '升级'],

  // Actors
  [/\bIran(ian)?\b/gi, '伊朗'],
  [/\bIsrael(i)?\b/gi, '以色列'],
  [/\bthe US\b/gi, '美国'],
  [/\bUnited States\b/gi, '美国'],
  [/\bAmerica(n)?\b/gi, '美国'],
  [/\bRussia(n)?\b/gi, '俄罗斯'],
  [/\bChina\b/gi, '中国'],
  [/\bSaudi Arabia\b/gi, '沙特阿拉伯'],
  [/\bLebanon\b/gi, '黎巴嫩'],
  [/\bHezbollah\b/gi, '真主党'],
  [/\bHamas\b/gi, '哈马斯'],
  [/\bHouthis?\b/gi, '胡塞武装'],
  [/\bGaza\b/gi, '加沙'],
  [/\bUkraine\b/gi, '乌克兰'],
  [/\bNATO\b/gi, 'NATO'],
  [/\bUN\b/gi, '联合国'],
  [/\bIAEA\b/gi, '国际原子能机构'],

  // Weapons/Nuclear
  [/\bnuclear\b/gi, '核'],
  [/\bnuke\b/gi, '核武器'],
  [/\bweapon[s]?\b/gi, '武器'],
  [/\bmissile[s]?\b/gi, '导弹'],
  [/\bdrone[s]?\b/gi, '无人机'],
  [/\bbomb[s]?\b/gi, '炸弹'],
  [/\bwarhead[s]?\b/gi, '弹头'],
  [/\benrichment\b/gi, '浓缩铀'],
  [/\benrich\b/gi, '浓缩'],
  [/\buranium\b/gi, '铀'],
  [/\bJCPOA\b/gi, '核协议(JCPOA)'],
  [/\bnuclear deal\b/gi, '核协议'],
  [/\bnuclear program\b/gi, '核计划'],
  [/\bnuclear bomb\b/gi, '核弹'],
  [/\bnuclear test\b/gi, '核试验'],

  // Time expressions
  [/\bby end of\b/gi, '在'],
  [/\bbefore\b/gi, '在…之前'],
  [/\bby\b/gi, '在…前'],
  [/\buntil\b/gi, '直到'],
  [/\bin (\d{4})\b/gi, (m: string) => m.replace('in ', '') + '年内'],
  [/\bthis year\b/gi, '今年'],
  [/\bnext year\b/gi, '明年'],
  [/\bQ1\b/gi, '第一季度'],
  [/\bQ2\b/gi, '第二季度'],
  [/\bQ3\b/gi, '第三季度'],
  [/\bQ4\b/gi, '第四季度'],

  // Outcomes
  [/\bYes\b/g, '是'],
  [/\bNo\b/g, '否'],
  [/\bhappen\b/gi, '发生'],
  [/\boccur\b/gi, '发生'],
  [/\btake place\b/gi, '发生'],
  [/\bstart\b/gi, '开始'],
  [/\bend\b/gi, '结束'],
  [/\bwin\b/gi, '获胜'],
  [/\blose\b/gi, '失败'],
  [/\bfall\b/gi, '倒台'],
  [/\bcollapse\b/gi, '崩溃'],
  [/\bsurvive\b/gi, '存活'],
  [/\bdie\b/gi, '死亡'],
  [/\bkilled\b/gi, '遇难'],
  [/\bassassinated\b/gi, '遇刺'],
  [/\bregime\b/gi, '政权'],
  [/\bgovernment\b/gi, '政府'],
  [/\bpresident\b/gi, '总统'],
  [/\bsupreme leader\b/gi, '最高领袖'],
  [/\bKhamenei\b/gi, '哈梅内伊'],
  [/\bKhomeini\b/gi, '霍梅尼'],
  [/\bPezeshkian\b/gi, '佩泽什基安'],
]

export function translateTitle(text: string): string {
  if (!text) return text

  // First handle dates
  let result = translateDate(text)

  // Apply phrase replacements
  for (const [pattern, replacement] of PHRASE_MAP) {
    if (typeof replacement === 'string') {
      result = result.replace(pattern, replacement)
    } else {
      result = result.replace(pattern, replacement)
    }
  }

  // Clean up common English connecting words that weren't translated
  result = result
    .replace(/\bthe\b/gi, '')
    .replace(/\ba\b/gi, '')
    .replace(/\ban\b/gi, '')
    .replace(/\bwith\b/gi, '')
    .replace(/\band\b/gi, '和')
    .replace(/\bor\b/gi, '或')
    .replace(/\bin\b/gi, '在')
    .replace(/\bon\b/gi, '')
    .replace(/\bof\b/gi, '的')
    .replace(/\bto\b/gi, '')
    .replace(/\bfrom\b/gi, '从')
    .replace(/\bagainst\b/gi, '对')
    .replace(/\bbetween\b/gi, '之间')

  // Clean up extra spaces
  result = result.replace(/\s+/g, ' ').trim()

  return result || text
}

export function translateEventTitle(title: string): string {
  return translateTitle(title)
}
