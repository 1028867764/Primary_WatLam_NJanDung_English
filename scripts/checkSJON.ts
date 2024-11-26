import { Descriptions, Sentence, TypeGuard, Word, Meaning, ControversialDegree } from '../types';

function checkObject(input: object, template: {
  [key: string]: string | TypeGuard;
}) {
  const currentKeys = Object.keys(input);
  const validKeys = Object.keys(template);
  for (const cKey of currentKeys) {
    if (!validKeys.includes(cKey)) {
      // 冗余键
      return false;
    }
  }
  for (const vKey of validKeys) {
    if (!currentKeys.includes(vKey)) {
      // 缺键
      return false;
    }
    const rule = template[vKey];
    if (typeof rule === 'string') {
      if (typeof input[vKey] !== template[vKey]) {
        return false;
      }
    } else if (!rule(input[vKey])) {
      return false;
    }
  }
  return true;
}

function isDescriptions(input: object): input is Descriptions {
  return checkObject(input, {
    zh: 'string',
    en: 'string'
  });
}

function isSentence(input: object) {
  return checkObject(input, {
    format: 'string',
    descriptions: isDescriptions
  });
}

function checkArray(
  input: unknown,
  callback: TypeGuard | ((input: object) => boolean)
) {
  if (!Array.isArray(input)) {
    return false;
  }
  return !input.some(o => !callback(o));
}

function isSentences(input: object[]): input is Sentence[] {
  return checkArray(input, isSentence);
}

function isWord(input: object) {
  return checkObject(input, {
    format: 'string',
    descriptions: isDescriptions,
    sentences: isSentences
  });
}

function isWords(input: object[]): input is Word[] {
  return checkArray(input, isWord);
}

function isMeaning(input: object) {
  return checkObject(input, {
    descriptions: isDescriptions,
    words: isWords
  });
}

function isMeanings(input: object[]): input is Meaning[] {
  return checkArray(input, isMeaning);
}

function isStringArray(input: string[]): input is string[] {
  return checkArray(input, (input: unknown) => typeof input === 'string');
}

function isCVDegree(input: number): input is ControversialDegree {
  return [0, 1, 2].includes(input);
}

export function isEntry(input: object) {
  return checkObject(input, {
    unicode: 'string', 
    characters: isStringArray,
    controversial: isCVDegree,
    related: isStringArray,
    pinyin: 'string',
    bbakLau: 'string',
    jyutping: 'string',
    head: 'string',
    tail: 'string',
    refBy: isStringArray,
    meanings: isMeanings
  });
}
