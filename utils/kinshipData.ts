
/**
 * Simplified Chinese Kinship Database
 * 
 * Codes:
 * f: father (父)
 * m: mother (母)
 * h: husband (夫)
 * w: wife (妻)
 * s: son (子)
 * d: daughter (女)
 * ob: older brother (兄)
 * lb: younger brother (弟)
 * os: older sister (姐)
 * ls: younger sister (妹)
 */

const data: Record<string, string> = {
  // Level 0
  '': '我',
  
  // Level 1
  'f': '父亲',
  'm': '母亲',
  'h': '丈夫',
  'w': '妻子',
  's': '儿子',
  'd': '女儿',
  'ob': '哥哥',
  'lb': '弟弟',
  'os': '姐姐',
  'ls': '妹妹',

  // Level 2 (Paternal)
  'f,f': '爷爷',
  'f,m': '奶奶',
  'f,ob': '伯父',
  'f,lb': '叔叔',
  'f,os': '姑妈',
  'f,ls': '姑姑',
  
  // Level 2 (Maternal)
  'm,f': '外公',
  'm,m': '外婆',
  'm,ob': '舅舅',
  'm,lb': '舅舅',
  'm,os': '姨妈',
  'm,ls': '姨妈',

  // Level 2 (Spouse)
  'h,f': '公公',
  'h,m': '婆婆',
  'w,f': '岳父',
  'w,m': '岳母',

  // Level 2 (Siblings' Spouse/Children)
  'ob,w': '嫂子',
  'lb,w': '弟妹',
  'os,h': '姐夫',
  'ls,h': '妹夫',
  
  'ob,s': '侄子',
  'ob,d': '侄女',
  'lb,s': '侄子',
  'lb,d': '侄女',
  
  'os,s': '外甥',
  'os,d': '外甥女',
  'ls,s': '外甥',
  'ls,d': '外甥女',

  // Level 3 (Grandparents)
  'f,f,f': '曾祖父',
  'f,f,m': '曾祖母',
  'f,m,f': '曾外祖父',
  'f,m,m': '曾外祖母',
  
  'm,f,f': '外曾祖父',
  'm,f,m': '外曾祖母',

  // Level 3 (Cousins - Paternal)
  'f,ob,s': '堂哥', // older implied if not specific, usually mapped generic
  'f,ob,d': '堂姐',
  'f,lb,s': '堂弟',
  'f,lb,d': '堂妹',
  
  'f,os,s': '表哥',
  'f,os,d': '表姐',
  
  // Level 3 (Cousins - Maternal)
  'm,ob,s': '表哥',
  'm,ob,d': '表姐',
  
  // Level 3 (Children)
  's,s': '孙子',
  's,d': '孙女',
  'd,s': '外孙',
  'd,d': '外孙女',
};

export const getKinshipTitle = (chain: string[]): string => {
  const key = chain.join(',');
  return data[key] || '未知亲戚 (关系太远或未收录)';
};

export const BUTTONS = [
  { id: 'f', label: '父' },
  { id: 'm', label: '母' },
  { id: 'h', label: '夫' },
  { id: 'w', label: '妻' },
  { id: 's', label: '子' },
  { id: 'd', label: '女' },
  { id: 'ob', label: '兄' },
  { id: 'lb', label: '弟' },
  { id: 'os', label: '姐' },
  { id: 'ls', label: '妹' },
];
