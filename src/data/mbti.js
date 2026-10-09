export const mbtiGroups = [
  { id: 'analysts', color: '#8c6ba2', types: ['INTJ', 'INTP', 'ENTJ', 'ENTP'], names: { zh: '分析家', en: 'Analysts', ja: '分析家' } },
  { id: 'diplomats', color: '#488a65', types: ['INFJ', 'INFP', 'ENFJ', 'ENFP'], names: { zh: '外交家', en: 'Diplomats', ja: '外交官' } },
  { id: 'sentinels', color: '#328d9d', types: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'], names: { zh: '守卫者', en: 'Sentinels', ja: '番人' } },
  { id: 'explorers', color: '#b68a24', types: ['ISTP', 'ISFP', 'ESTP', 'ESFP'], names: { zh: '探索者', en: 'Explorers', ja: '探検家' } },
];

export const mbtiTypes = mbtiGroups.flatMap(group => group.types);
export const mbtiCharacterSrc = type => `/assets/mbti/${type.toLowerCase()}.webp`;
export const mbtiGroupSrc = id => `/assets/mbti/${id}.webp`;
