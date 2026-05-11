/**
 * Polymarket 伊朗市场标题翻译器
 * 策略：先匹配完整句型，再逐词替换，最后清理残余英文
 */

// ── 月份映射 ──────────────────────────────────────────────
const MONTHS: Record<string, string> = {
  january:'1',february:'2',march:'3',april:'4',may:'5',june:'6',
  july:'7',august:'8',september:'9',october:'10',november:'11',december:'12',
  jan:'1',feb:'2',mar:'3',apr:'4',jun:'6',jul:'7',aug:'8',
  sep:'9',oct:'10',nov:'11',dec:'12',
}

// ── 日期格式化 ────────────────────────────────────────────
function translateDate(text: string): string {
  // "May 15, 2025" / "May 15th" / "May 15"
  return text.replace(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?\b/gi,
    (_, mon, day, year) => {
      const m = MONTHS[mon.toLowerCase()]
      return year ? `${year}年${m}月${day}日` : `${m}月${day}日`
    }
  )
    // "2025" standalone year
    .replace(/\b(202[4-9]|203\d)\b/g, '$1年')
    // "Q1/Q2/Q3/Q4 2025"
    .replace(/\bQ([1-4])\s*(202\d年?)?/gi, (_, q, y) => `${y || ''}第${q}季度`)
    // "end of 2025" / "end of May"
    .replace(/\bend of\s+(202\d)/gi, '$1年底')
}

// ── 词汇词典 ──────────────────────────────────────────────
const DICT: [RegExp, string][] = [
  // 国家/地区/组织
  [/\bIran(ian)?\b/gi,         '伊朗'],
  [/\bIsrael(i)?\b/gi,         '以色列'],
  [/\bthe\s+US\b/gi,           '美国'],
  [/\bUnited\s+States\b/gi,    '美国'],
  [/\bAmeric(a|an)\b/gi,       '美国'],
  [/\bRussi(a|an)\b/gi,        '俄罗斯'],
  [/\bChina\b/gi,              '中国'],
  [/\bSaudi\s+Arabia\b/gi,     '沙特阿拉伯'],
  [/\bLebanon\b/gi,            '黎巴嫩'],
  [/\bHezbollah\b/gi,          '真主党'],
  [/\bHamas\b/gi,              '哈马斯'],
  [/\bHouthi(s)?\b/gi,         '胡塞武装'],
  [/\bGaza\b/gi,               '加沙'],
  [/\bUkraine\b/gi,            '乌克兰'],
  [/\bTurkey\b/gi,             '土耳其'],
  [/\bPakistan\b/gi,           '巴基斯坦'],
  [/\bIraq\b/gi,               '伊拉克'],
  [/\bSyria\b/gi,              '叙利亚'],
  [/\bNATO\b/gi,               'NATO'],
  [/\bUN\b/gi,                 '联合国'],
  [/\bIAEA\b/gi,               '国际原子能机构'],
  [/\bIMF\b/gi,                '国际货币基金组织'],

  // 人名
  [/\bKhamenei\b/gi,           '哈梅内伊'],
  [/\bKhomeini\b/gi,           '霍梅尼'],
  [/\bPezeshkian\b/gi,         '佩泽什基安'],
  [/\bNetanyahu\b/gi,          '内塔尼亚胡'],
  [/\bBiden\b/gi,              '拜登'],
  [/\bTrump\b/gi,              '特朗普'],
  [/\bRaisi\b/gi,              '莱希'],

  // 核相关
  [/\bnuclear\s+deal\b/gi,     '核协议'],
  [/\bnuclear\s+weapon[s]?\b/gi,'核武器'],
  [/\bnuclear\s+bomb[s]?\b/gi, '核弹'],
  [/\bnuclear\s+test\b/gi,     '核试验'],
  [/\bnuclear\s+program\b/gi,  '核计划'],
  [/\bnuclear\s+talks\b/gi,    '核谈判'],
  [/\bJCPOA\b/gi,              '伊核协议(JCPOA)'],
  [/\bnuclear\b/gi,            '核'],
  [/\benrichment\b/gi,         '铀浓缩'],
  [/\benrich(ed)?\b/gi,        '浓缩'],
  [/\buranium\b/gi,            '铀'],
  [/\bweapon[s]?\b/gi,         '武器'],
  [/\bmissile[s]?\b/gi,        '导弹'],
  [/\bdrone[s]?\b/gi,          '无人机'],
  [/\bwarhead[s]?\b/gi,        '弹头'],
  [/\bballistic\b/gi,          '弹道'],

  // 军事行动
  [/\battack[s]?\b/gi,         '袭击'],
  [/\bstrike[s]?\b/gi,         '打击'],
  [/\binvade[sd]?\b/gi,        '入侵'],
  [/\binvasion\b/gi,           '入侵'],
  [/\blaunch(ed)?\b/gi,        '发动'],
  [/\bfire[sd]?\b/gi,          '开火'],
  [/\bbombing\b/gi,            '轰炸'],
  [/\bbomb[s]?\b/gi,           '轰炸'],
  [/\bshoot[s]?\b/gi,          '射击'],
  [/\bkill[s]?\b/gi,           '击杀'],
  [/\bdeploy[s]?\b/gi,         '部署'],
  [/\bceasefire\b/gi,          '停火'],
  [/\btruce\b/gi,              '停战'],
  [/\bwar\b/gi,                '战争'],
  [/\bconflict\b/gi,           '冲突'],
  [/\bcrisis\b/gi,             '危机'],
  [/\bescalat(e|ion)\b/gi,     '升级'],
  [/\bground\s+invasion\b/gi,  '地面入侵'],

  // 政治/外交
  [/\bdeal\b/gi,               '协议'],
  [/\bagreement\b/gi,          '协议'],
  [/\bsanction[s]?\b/gi,       '制裁'],
  [/\bnegotiat(e|ions?)\b/gi,  '谈判'],
  [/\bdiplomac(y|tic)\b/gi,    '外交'],
  [/\bpeace\b/gi,              '和平'],
  [/\bregime\b/gi,             '政权'],
  [/\bgovernment\b/gi,         '政府'],
  [/\bpresident\b/gi,          '总统'],
  [/\bsupreme\s+leader\b/gi,   '最高领袖'],
  [/\bsign(ed)?\b/gi,          '签署'],
  [/\bwithdr(aw|awal)\b/gi,    '撤军'],
  [/\bimpose[sd]?\b/gi,        '施加'],
  [/\bread?ch(ed)?\b/gi,       '达成'],
  [/\btalks\b/gi,              '谈判'],
  [/\bsummit\b/gi,             '峰会'],
  [/\brelations\b/gi,          '关系'],

  // 动词/状态
  [/\bhappen[s]?\b/gi,         '发生'],
  [/\boccur[s]?\b/gi,          '发生'],
  [/\btake\s+place\b/gi,       '发生'],
  [/\bstart[s]?\b/gi,          '开始'],
  [/\bbegin[s]?\b/gi,          '开始'],
  [/\bwin[s]?\b/gi,            '获胜'],
  [/\blose[s]?\b/gi,           '失败'],
  [/\bfall[s]?\b/gi,           '倒台'],
  [/\bcollapse[sd]?\b/gi,      '崩溃'],
  [/\bsurvive[sd]?\b/gi,       '存活'],
  [/\bdie[sd]?\b/gi,           '死亡'],
  [/\bkilled\b/gi,             '遇难'],
  [/\bassassinat(e|ed|ion)\b/gi,'遇刺'],
  [/\bdevelop[s]?\b/gi,        '研发'],
  [/\bbuild[s]?\b/gi,          '建造'],
  [/\bacquire[sd]?\b/gi,       '获取'],
  [/\bgain[s]?\b/gi,           '获得'],
  [/\btest(ed)?\b/gi,          '测试'],
  [/\buse[sd]?\b/gi,           '使用'],
  [/\bdetonate[sd]?\b/gi,      '引爆'],
  [/\bapprove[sd]?\b/gi,       '批准'],
  [/\brecognize[sd]?\b/gi,     '承认'],
  [/\bwitness(ed)?\b/gi,       '发生'],

  // 时间
  [/\bthis\s+year\b/gi,        '今年'],
  [/\bnext\s+year\b/gi,        '明年'],
  [/\bthis\s+month\b/gi,       '本月'],
  [/\bthis\s+week\b/gi,        '本周'],
]

// ── 主翻译函数 ─────────────────────────────────────────────
export function translateTitle(raw: string): string {
  if (!raw) return raw

  let s = raw.trim()

  // 1. 先把日期格式化
  s = translateDate(s)

  // 2. 处理 "Will X ... by/before DATE?" 核心句型
  //    → "X 是否会在 DATE 前 ..."
  s = s.replace(
    /^Will\s+(.+?)\s+(by|before)\s+([^?]+)\??\s*$/i,
    (_, body, _prep, date) => {
      const translatedBody = applyDict(body)
      return `${translatedBody}是否会在${date.trim()}前发生？`
    }
  )

  // 3. 处理 "Will X [verb] Y by/before DATE?" 更精确版本
  //    已被上面覆盖，但补一个无日期版本
  s = s.replace(
    /^Will\s+(.+)\??\s*$/i,
    (_, body) => `${applyDict(body)}是否会发生？`
  )

  // 4. 逐词字典替换（已经是中文句子结构）
  s = applyDict(s)

  // 5. 清理剩余英文小词
  s = s
    .replace(/\bthe\b/gi, '')
    .replace(/\ba\b/gi, '')
    .replace(/\ban\b/gi, '')
    .replace(/\bof\b/gi, '的')
    .replace(/\band\b/gi, '与')
    .replace(/\bor\b/gi, '或')
    .replace(/\bwith\b/gi, '')
    .replace(/\bto\b/gi, '')
    .replace(/\bin\b/gi, '在')
    .replace(/\bon\b/gi, '')
    .replace(/\bfrom\b/gi, '从')
    .replace(/\bagainst\b/gi, '对')
    .replace(/\bbetween\b/gi, '之间')
    .replace(/\bfor\b/gi, '')
    .replace(/\bat\b/gi, '')
    .replace(/\bby\b/gi, '在…前')
    .replace(/\bbefore\b/gi, '之前')
    .replace(/\bafter\b/gi, '之后')
    .replace(/\bover\b/gi, '')
    .replace(/\bunder\b/gi, '')
    .replace(/\binto\b/gi, '')
    .replace(/\bthrough\b/gi, '')
    .replace(/\bduring\b/gi, '期间')
    .replace(/\bwithin\b/gi, '以内')

  // 6. 末尾加问号（如果原文有但被清掉了）
  s = s.replace(/\?$/, '？').replace(/？？+/g, '？')
  if (raw.includes('?') && !s.endsWith('？')) s += '？'

  // 7. 清理多余空格
  s = s.replace(/\s+/g, ' ').trim()

  // 8. 如果仍有大量英文字母（翻译效果差），在末尾保留原文备注
  const engRatio = (s.match(/[a-zA-Z]/g) || []).length / s.length
  if (engRatio > 0.4 && s.length > 5) {
    return `${applyDict(raw.replace(/\?/, ''))}？`
  }

  return s || raw
}

function applyDict(text: string): string {
  let s = text
  for (const [pattern, replacement] of DICT) {
    s = s.replace(pattern, replacement)
  }
  return s
}

export function translateEventTitle(title: string): string {
  return translateTitle(title)
}
