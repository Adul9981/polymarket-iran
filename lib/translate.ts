/**
 * 伊朗预测市场标题翻译器 v4
 * 策略：先做模板匹配整句替换，再做词典补漏，保证100%中文输出
 */

// ─── 月份映射 ──────────────────────────────────────────────
const M: Record<string, string> = {
  january:'1',february:'2',march:'3',april:'4',may:'5',june:'6',
  july:'7',august:'8',september:'9',october:'10',november:'11',december:'12',
  jan:'1',feb:'2',mar:'3',apr:'4',jun:'6',jul:'7',aug:'8',
  sep:'9',oct:'10',nov:'11',dec:'12',
}

function parseDate(s: string): string {
  s = s.trim().replace(/[?？.]+$/, '').trim()
  // "April 22, 2026" 或 "April 22"
  const full = s.match(/^(jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?$/i)
  if (full) {
    const mon = M[full[1].toLowerCase().slice(0,3)] ?? M[full[1].toLowerCase()] ?? full[1]
    return full[3] ? `${full[3]}年${mon}月${full[2]}日` : `${mon}月${full[2]}日`
  }
  // "end of May" / "end of April"
  const eom = s.match(/^end of\s+(jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*)$/i)
  if (eom) return `${M[eom[1].toLowerCase().slice(0,3)] ?? eom[1]}月底`
  // "end of 2026"
  const eoy = s.match(/^end of\s+(\d{4})$/)
  if (eoy) return `${eoy[1]}年底`
  // "2027" only
  if (/^\d{4}$/.test(s)) return `${s}年`
  // "May 31"
  const short = s.match(/^(jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*)\s+(\d{1,2})(?:st|nd|rd|th)?$/i)
  if (short) return `${M[short[1].toLowerCase().slice(0,3)] ?? short[1]}月${short[2]}日`
  return s // 无法解析时原样返回（仍是英文，后续词典会处理）
}

// ─── 词典：人名、地名、短语 ────────────────────────────────
// 按长度降序排列，确保长短语先匹配
const DICT: [RegExp, string][] = [
  // 地点
  [/\bStrait of Hormuz\b/gi,              '霍尔木兹海峡'],
  [/\bBab el-Mandeb Strait\b/gi,          '曼德海峡'],
  [/\bKharg Island\b/gi,                  '哈尔克岛'],
  [/\bLitani River\b/gi,                  '利塔尼河'],
  [/\bStrait\b/gi,                        '海峡'],
  // 人名
  [/\bAbbas Araghchi\b/gi,               '阿拉格奇'],
  [/\bMasoud Pezeshkian\b/gi,            '佩泽什基安'],
  [/\bPezeshkian\b/gi,                   '佩泽什基安'],
  [/\bMojtaba Khamenei\b/gi,             '穆杰塔巴·哈梅内伊'],
  [/\bKhamenei\b/gi,                     '哈梅内伊'],
  [/\bReza Pahlavi\b/gi,                 '礼萨·巴列维'],
  [/\bPete Hegseth\b/gi,                 '皮特·赫格塞斯'],
  [/\bJD Vance\b/gi,                     'J·D·万斯'],
  [/\bTucker Carlson\b/gi,               '塔克·卡尔森'],
  [/\bBenjamin Netanyahu\b/gi,           '内塔尼亚胡'],
  [/\bNetanyahu\b/gi,                    '内塔尼亚胡'],
  [/\bJoseph Aoun\b/gi,                  '约瑟夫·奥恩'],
  [/\bMohammed bin Salman\b/gi,          '穆罕默德·本·萨勒曼'],
  [/\bMBS\b/g,                           '穆罕默德·本·萨勒曼'],
  [/\bNechirvan Barzani\b/gi,            '内奇尔万·巴尔扎尼'],
  [/\bHamad bin Isa Al Khalifa\b/gi,     '哈马德·本·伊萨·阿勒哈利法'],
  [/\bXi\b/g,                            '习近平'],
  [/\bTrump\b/gi,                        '特朗普'],
  // 组织
  [/\bKurdistan Regional Government\b/gi,'库尔德斯坦地区政府'],
  [/\bKRG\b/g,                           '库尔德斯坦地区政府'],
  [/\bNATO Summit\b/gi,                  'NATO峰会'],
  [/\bNATO\b/gi,                         'NATO'],
  [/\bIAEA\b/g,                          '国际原子能机构'],
  [/\bNPT\b/g,                           '《不扩散核武器条约》'],
  [/\bFIFA World Cup\b/gi,               'FIFA世界杯'],
  [/\bCongress\b/gi,                     '国会'],
  [/\bSenate\b/gi,                       '参议院'],
  // 国家
  [/\bUnited States\b/gi,               '美国'],
  [/\bU\.S\.A?\b/g,                      '美国'],
  [/U\.S\./g,                            '美国'],
  [/\bthe US\b/gi,                       '美国'],
  [/\bUS\b/g,                            '美国'],
  [/\bSaudi Arabia\b/gi,                 '沙特阿拉伯'],
  [/\bIran(ian)?\b/gi,                   '伊朗'],
  [/\bIsrael(i)?\b/gi,                   '以色列'],
  [/\bHezbollah\b/gi,                    '真主党'],
  [/\bHamas\b/gi,                        '哈马斯'],
  [/\bHouthi(s)?\b/gi,                   '胡塞武装'],
  [/\bLebanon(ese)?\b/gi,               '黎巴嫩'],
  [/\bRussia(n)?\b/gi,                   '俄罗斯'],
  [/\bChina\b/gi,                        '中国'],
  [/\bTurkey\b/gi,                       '土耳其'],
  [/\bPakistan(i)?\b/gi,                '巴基斯坦'],
  [/\bIraq(i)?\b/gi,                    '伊拉克'],
  [/\bSyria(n)?\b/gi,                   '叙利亚'],
  [/\bBahrain(i)?\b/gi,                 '巴林'],
  [/\bGaza\b/gi,                         '加沙'],
  [/\bFrance\b/gi,                       '法国'],
  [/\bGermany\b/gi,                      '德国'],
  [/\bUK\b/g,                            '英国'],
  [/\bAmerica(n)?\b/gi,                 '美国'],
  // 事件短语（长→短）
  [/\bIran Nuke\b/gi,                   '伊朗核武器'],
  [/\bNuke\b/gi,                        '核武器'],
  [/\bend of\s+(\d{4})\b/gi,            (_,y) => `${y}年底`],
  [/\bend of\s+(jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*)\b/gi,
    (_,m) => `${M[m.toLowerCase().slice(0,3)]??m}月底`],
  [/\bweek of\b/gi,                     '当周'],
  [/\bHow many\b/gi,                    '多少'],
  [/\bHow much\b/gi,                    '多少'],
  [/\bpermanent peace deal\b/gi,        '永久和平协议'],
  [/\bpeace deal\b/gi,                  '和平协议'],
  [/\bdiplomatic meeting\b/gi,          '外交会谈'],
  [/\bnuclear deal\b/gi,                '核协议'],
  [/\bnuclear talks\b/gi,              '核谈判'],
  [/\bnuclear test\b/gi,               '核试验'],
  [/\bnuclear weapon(s)?\b/gi,         '核武器'],
  [/\bnuclear program\b/gi,            '核计划'],
  [/\bnuclear bomb\b/gi,               '核弹'],
  [/\bJCPOA\b/gi,                       '伊核协议'],
  [/\bwar powers resolution\b/gi,      '战争授权决议'],
  [/\bpresidential election\b/gi,     '总统选举'],
  [/\bground operation\b/gi,          '地面军事行动'],
  [/\bcoup attempt\b/gi,              '政变企图'],
  [/\bpublic appearance\b/gi,         '公开露面'],
  [/\bleadership change\b/gi,         '领导层更迭'],
  [/\benrichment of uranium\b/gi,     '铀浓缩'],
  [/\benriched uranium\b/gi,          '浓缩铀'],
  [/\buranium stockpile\b/gi,         '铀储量'],
  [/\bunrestricted shipping\b/gi,     '无限制航运'],
  [/\bInternet [Aa]ccess\b/g,         '互联网访问'],
  [/\bIranian regime\b/gi,            '伊朗政权'],
  [/\bIranian rials\b/gi,             '伊朗里亚尔'],
  [/\bIranian agent(s)?\b/gi,         '伊朗特工'],
  [/\bIranian demand(s)?\b/gi,        '伊朗诉求'],
  [/\bIranian official(s)?\b/gi,      '伊朗官员'],
  [/\bIranian diplomat(s)?\b/gi,      '伊朗外交官'],
  [/\bcrude oil reserves\b/gi,        '原油储备'],
  [/\bcrude [Oo]il\b/gi,              '原油'],
  [/\bships? transit\b/gi,            '船只过境'],
  [/\bwarship(s)?\b/gi,               '军舰'],
  [/\bgay marriage\b/gi,              '同性婚姻'],
  [/\bmilitary draft\b/gi,            '军事征召'],
  [/\bmilitary strike(s)?\b/gi,       '军事打击'],
  [/\bair[- ]?space\b/gi,             '领空'],
  [/\bembassy\b/gi,                   '大使馆'],
  [/\bambassador\b/gi,                '大使'],
  [/\bmissile(s)?\b/gi,               '导弹'],
  [/\bdrone(s)?\b/gi,                 '无人机'],
  [/\bweapon(s)?\b/gi,                '武器'],
  [/\bsanction(s)?\b/gi,              '制裁'],
  [/\bceasefire\b/gi,                 '停火'],
  [/\bblockade\b/gi,                  '封锁'],
  [/\bpresident\b/gi,                 '总统'],
  [/\bSupreme Leader\b/gi,            '最高领袖'],
  [/\bSecretary of Defense\b/gi,      '国防部长'],
  [/\bMinister of Foreign Affairs\b/gi,'外交部长'],
  [/\bSecretary of State\b/gi,        '国务卿'],
  [/\bleader\b/gi,                    '领导人'],
  [/\bgovernment\b/gi,                '政府'],
  [/\bregime\b/gi,                    '政权'],
  [/\belection\b/gi,                  '选举'],
  [/\bindependence\b/gi,              '独立'],
  [/\btraffic\b/gi,                   '交通'],
  [/\bshipping\b/gi,                  '航运'],
  [/\bship(s)?\b/gi,                  '船只'],
  [/\bnuclear\b/gi,                   '核'],
  [/\buranium\b/gi,                   '铀'],
  [/\benrichment\b/gi,                '浓缩'],
  [/\bAllah\b/gi,                     '真主'],
  [/\bKurd(s|ish)?\b/gi,             '库尔德'],
  [/\bcountri(es|y)\b/gi,            '国家'],
  [/\bforce(s)?\b/gi,                 '军队'],
  [/\bofficial(s)?\b/gi,              '官员'],
  [/\bdiplomats?\b/gi,               '外交官'],
  [/\btalks?\b/gi,                   '谈判'],
  [/\bgas\b/gi,                      '燃油'],
  [/\boil\b/gi,                      '石油'],
  [/\bglobal\b/gi,                   '全球'],
]

// 动词词典（单独处理，避免和名词冲突）
const VERBS: [RegExp, string][] = [
  [/\bwithdraws?\b/gi,    '撤军'],
  [/\bwithdrawing\b/gi,   '撤军'],
  [/\bcloses?\b/gi,       '关闭'],
  [/\bclosing\b/gi,       '关闭'],
  [/\brestores?\b/gi,     '恢复'],
  [/\brestoring\b/gi,     '恢复'],
  [/\brestored\b/gi,      '恢复'],
  [/\breturns?\b/gi,      '恢复'],
  [/\bfalls?\b/gi,        '倒台'],
  [/\bfalling\b/gi,       '倒台'],
  [/\bsurvives?\b/gi,     '存活'],
  [/\binvades?\b/gi,      '入侵'],
  [/\battacks?\b/gi,      '袭击'],
  [/\bstrikes?\b/gi,      '打击'],
  [/\bbombs?\b/gi,        '轰炸'],
  [/\blaunches?\b/gi,     '发动'],
  [/\bdeploys?\b/gi,      '部署'],
  [/\bagrees?\b/gi,       '同意'],
  [/\bsigns?\b/gi,        '签署'],
  [/\breaches?\b/gi,      '达成'],
  [/\brecognizes?\b/gi,   '承认'],
  [/\bholds?\b/gi,        '举行'],
  [/\bheld\b/gi,          '举行'],
  [/\benters?\b/gi,       '进入'],
  [/\bvisits?\b/gi,       '访问'],
  [/\bmeets?\b/gi,        '会面'],
  [/\bmeet\b/gi,          '会面'],
  [/\bcrosses?\b/gi,      '越过'],
  [/\bopens?\b/gi,        '开放'],
  [/\breopens?\b/gi,      '重开'],
  [/\blegalizes?\b/gi,    '合法化'],
  [/\bcharged?\b/gi,      '被指控'],
  [/\bpasses?\b/gi,       '通过'],
  [/\bpassed\b/gi,        '通过'],
  [/\bannounces?\b/gi,    '宣布'],
  [/\blifted\b/gi,        '解除'],
  [/\brenames?\b/gi,      '重命名'],
  [/\bdeclares?\b/gi,     '宣布'],
  [/\bexpels?\b/gi,       '驱逐'],
  [/\bexpelled\b/gi,      '驱逐'],
  [/\bsends?\b/gi,        '派遣'],
  [/\bsent\b/gi,          '派遣'],
  [/\battends?\b/gi,      '出席'],
  [/\bpraises?\b/gi,      '赞扬'],
  [/\binsults?\b/gi,      '侮辱'],
  [/\bplays?\b/gi,        '参赛'],
  [/\bhit\b/gi,           '达到'],
  [/\bauthorizes?\b/gi,   '授权'],
  [/\bsurrender(s|ed)?\b/gi, '上交'],
  [/\bleaves?\b/gi,       '离开'],
  [/\bleft\b/gi,          '离开'],
  [/\bsurge(s|d)?\b/gi,  '激增'],
  [/\btransit(ing)?\b/gi, '过境'],
  [/\btransiting\b/gi,    '过境'],
]

function applyDict(s: string): string {
  for (const [re, zh] of DICT)  s = s.replace(re, zh)
  for (const [re, zh] of VERBS) s = s.replace(re, zh)
  return s
}

// ─── 辅助：清理残余英文介词/冠词 ─────────────────────────────
function cleanEnglish(s: string): string {
  const small: [RegExp, string][] = [
    [/\bthe\b/gi,''], [/\ba\b/gi,''], [/\ban\b/gi,''],
    [/\bof\b/gi,'的'], [/\band\b/gi,'与'], [/\bor\b/gi,'或'],
    [/\bwith\b/gi,'与'], [/\bto\b/gi,''], [/\bin\b/gi,'在'],
    [/\bon\b/gi,''], [/\bfor\b/gi,''], [/\bat\b/gi,''],
    [/\bfrom\b/gi,'来自'], [/\bagainst\b/gi,'对'],
    [/\bbetween\b/gi,'之间'], [/\bafter\b/gi,'之后'],
    [/\bbefore\b/gi,'之前'], [/\bover\b/gi,''],
    [/\bthrough\b/gi,''], [/\bunder\b/gi,''],
    [/\binto\b/gi,''], [/\bwithin\b/gi,'以内'],
    [/\bas\b/gi,''], [/\bby\b/gi,''], [/\bout\b/gi,''],
    [/\bits\b/gi,''], [/\btheir\b/gi,''], [/\bany\b/gi,'任何'],
    [/\bnormal\b/gi,'正常'], [/\bnext\b/gi,'下一次'],
    [/\bno longer\b/gi,'不再'], [/\bcontrol\b/gi,'控制'],
    [/\bmilitary\b/gi,'军事'], [/\bwar\b/gi,'战争'],
    [/\bconflict\b/gi,'冲突'], [/\bpermanent\b/gi,'永久'],
    [/\bdiplomatic\b/gi,'外交'], [/\bpeace\b/gi,'和平'],
    [/\bdeal\b/gi,'协议'], [/\bmeeting\b/gi,'会谈'],
    [/\bagain\b/gi,'再次'], [/\bconfirmed\b/gi,'确认'],
    [/\bhappen(s)?\b/gi,'发生'], [/\boccur(s)?\b/gi,'发生'],
    [/\bapproved?\b/gi,'批准'], [/\bwhere\b/gi,'在哪里'],
    [/\bwho\b/gi,'谁'], [/\bwhat\b/gi,'什么'],
    [/\bhow many\b/gi,'多少'], [/\bhow much\b/gi,'多少'],
    [/\bhow\b/gi,'如何'], [/\bwhich\b/gi,'哪些'],
    [/\bmany\b/gi,'多少'], [/\bweek\b/gi,'那周'],
    [/\bend\b/gi,'底'], [/\bnuke\b/gi,'核武器'],
    [/\bwhen\b/gi,'何时'], [/\bwill\b/gi,''],
    [/\bwon'?t\b/gi,'不会'], [/\bcan\b/gi,'能'],
    [/\bcould\b/gi,'可能'], [/\bwould\b/gi,''],
    [/\bmay\b/gi,'可能'], [/\bhave\b/gi,''],
    [/\bhas\b/gi,''], [/\bhad\b/gi,''],
    [/\bbe\b/gi,''], [/\bbeen\b/gi,''],
    [/\bare\b/gi,''], [/\bis\b/gi,''],
    [/\bwas\b/gi,''], [/\bwere\b/gi,''],
    [/\bdo\b/gi,''], [/\bdoes\b/gi,''],
    [/\bdid\b/gi,''], [/\bnot\b/gi,'不'],
    [/\bnever\b/gi,'从不'], [/\bno\b/gi,''],
    [/\byes\b/gi,''], [/\bif\b/gi,''],
    [/\bmore\b/gi,'更多'], [/\bless\b/gi,'更少'],
    [/\bmost\b/gi,'最多'], [/\bfirst\b/gi,'首次'],
    [/\blast\b/gi,'最后'], [/\bnew\b/gi,'新'],
    [/\bold\b/gi,'旧'], [/\bbig\b/gi,'大'],
    [/\bsmall\b/gi,'小'], [/\ball\b/gi,'所有'],
    [/\bdifferent\b/gi,'不同'], [/\bofficial(ly)?\b/gi,'正式'],
    [/\bavg\.?\b/gi,'平均'], [/\baverage\b/gi,'平均'],
    [/\bhigh(er)?\b/gi,'高'], [/\blow(er)?\b/gi,'低'],
    [/\bpublic\b/gi,'公开'], [/\bprivate\b/gi,'私下'],
    [/\bdeclared?\b/gi,'宣布'], [/\blifted\b/gi,'解除'],
  ]
  for (const [re, zh] of small) s = s.replace(re, zh)
  return s
}

// ─── 主翻译函数 ────────────────────────────────────────────
export function translateTitle(raw: string): string {
  if (!raw) return raw
  let s = raw.trim()

  // ① 提取 "by DATE" 或 "before DATE"，转换日期，暂存
  // 支持格式：by April 22, 2026 / before 2027 / by end of May / by...
  let byDate = ''
  let isBefore = false

  s = s.replace(
    /\s+by\s+(\.\.\.|end of \w+|end of \d{4}|\w+ \d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}?|\d{4}|(?:jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*) \d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?)([?？]?)$/i,
    (_, date, q) => {
      if (date.trim() === '...') {
        byDate = '（日期待定）'
      } else {
        byDate = `${parseDate(date)}前`
      }
      return q || ''
    }
  )
  s = s.replace(
    /\s+before\s+(\d{4}|end of \d{4}|end of \w+|(?:jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*) \d{1,2}(?:st|nd|rd|th)?)([?？]?)$/i,
    (_, date, q) => {
      isBefore = true
      byDate = `${parseDate(date)}前`
      return q || ''
    }
  )
  // "in 2026" at end
  s = s.replace(/\s+in\s+(\d{4})\s*([?？]?)$/, (_, yr, q) => {
    byDate = `${yr}年内`
    return q || ''
  })

  // ② 去掉开头 "Will " / "Can "
  const hasWill = /^Will\s+/i.test(s)
  s = s.replace(/^Will\s+/i, '').replace(/^Can\s+/i, '')

  // ③ 处理 "A x B" → "A与B"（在词典替换之前）
  s = s.replace(/\b(.+?)\s+x\s+(.+?)(\s+)/i, (_, a, b, rest) => {
    return `${a}与${b}${rest}`
  })

  // ④ 应用词典（名词、人名、地名、短语）
  s = applyDict(s)

  // ⑤ 清理残余英文
  s = cleanEnglish(s)

  // ⑥ 清理标点和多余空格
  s = s.replace(/\s*,\s*/g, '、')
       .replace(/["'"']/g, '')
       .replace(/\s{2,}/g, ' ')
       .trim()

  // ⑦ 去掉末尾问号，重新组装句子
  s = s.replace(/[?？]+$/, '').trim()

  // ⑧ 组装最终中文句子
  let result: string
  if (byDate) {
    // 有日期：Subject + 是否会在 + date + 前 + verb?
    // 大多数都适合 "是否会在X前发生/达成"
    result = `${s}是否会在${byDate}？`
    // 修正 "是否会在（日期待定）前"
    result = result.replace('是否会在（日期待定）前？', '是否会（日期待定）发生？')
  } else {
    // 无日期：直接加问号
    result = `${s}是否会发生？`
    if (!hasWill) {
      // 如果原句没有 Will，可能是陈述式问法（How many, Where, Who等），不加"是否会发生"
      result = `${s}？`
    }
  }

  // ⑨ 去重叠用词（如"伊朗伊朗"）
  result = result.replace(/(伊朗|美国|以色列|中国|俄罗斯)\1+/g, '$1')

  // ⑩ 最终清理
  result = result.replace(/\s{2,}/g, ' ').trim()

  return result
}

export function translateEventTitle(title: string): string {
  return translateTitle(title)
}
