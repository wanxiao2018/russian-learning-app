/**
 * Translate POS (part of speech) tags to Chinese
 */

const POS_MAP = {
  // Nouns
  'noun': '名词',
  'noun.m': '名词（阳）',
  'noun.f': '名词（阴）',
  'noun.n': '名词（中）',
  'noun.m/f': '名词',
  
  // Verbs
  'verb': '动词',
  'verb impf': '动词（未完成体）',
  'verb pf': '动词（完成体）',
  'verb impf/pf': '动词',
  'verb reflexive': '反身动词',
  
  // Adjectives
  'adj': '形容词',
  'adj/adj': '形容词',
  'adj short': '短尾形容词',
  
  // Adverbs
  'adv': '副词',
  'adverb': '副词',
  
  // Prepositions
  'prep': '前置词',
  'preposition': '前置词',
  
  // Conjunctions
  'conj': '连词',
  'conjunction': '连词',
  
  // Pronouns
  'pron': '代词',
  'pronoun': '代词',
  
  // Particles
  'particle': '语气词',
  'part': '语气词',
  
  // Numbers
  'num': '数词',
  'numeral': '数词',
  
  // Interjections
  'interj': '感叹词',
  'interjection': '感叹词',
  
  // Phrases
  'phrase': '短语',
  'phraseologism': '习语',
  'idiom': '成语',
  
  // Others
  'predicative': '谓语词',
  'parenthesis': '插入语',
  'gerund': '副动词',
  'participle': '形动词',
};

export function translatePOS(pos) {
  if (!pos) return '';
  
  const normalized = pos.trim().toLowerCase();
  
  // Direct match
  if (POS_MAP[normalized]) {
    return POS_MAP[normalized];
  }
  
  // Partial match
  for (const [key, value] of Object.entries(POS_MAP)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  // Return original if no match
  return pos;
}

/**
 * Get CSS class for POS
 */
export function getPOSClass(pos) {
  if (!pos) return 'pos-unknown';
  
  const normalized = pos.trim().toLowerCase();
  
  if (normalized.includes('noun')) return 'pos-noun';
  if (normalized.includes('verb')) return 'pos-verb';
  if (normalized.includes('adj')) return 'pos-adj';
  if (normalized.includes('adv')) return 'pos-adv';
  if (normalized.includes('prep')) return 'pos-prep';
  if (normalized.includes('phrase') || normalized.includes('idiom')) return 'pos-phrase';
  
  return 'pos-other';
}
