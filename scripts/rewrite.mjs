import fs from 'fs';
import { pinyin } from 'pinyin-pro';

const db = JSON.parse(fs.readFileSync('./deprecated/鬱字3.json', 'utf-8'));

class DBTemplate {
  constructor() {
    this.version = '0.0.2';
    this.createTime = '2023-12-30';
    this.updateTime = new Date().toISOString();
    this.creators = [
      {
        name: 'jiaojiaodubai',
        email: 'jiaojiaodubai23@gmial.coom'
      }
    ];
    this.data = [];
  }
}

function checkKey(keys, obj) {
  for (const key in obj) {
    if (!keys.includes(key.replace(/^@/, ''))) {
      throw new Error('no such key: ' + key);
    }
  }
}

const oldEntryKeys = [
  'id',
  'unicode',
  'character',
  'optional_character',
  'character_controversial_degree',
  'related_search',
  'ref',
  'pinyin',
  'jyut++',
  'IPA',
  'stroke',
  'head',
  'tail',
  'meanings'
];

function transSubDB(name, key) {
  const dbt = new DBTemplate();
  dbt.name = name;
  for (const entry of db.data[key]) {
    checkKey(oldEntryKeys, entry);
    console.log(entry.character);
    const characters = entry.optional_character;
    characters.unshift(entry.character);
    dbt.data.push({
      id: entry.id,
      unicode: entry.unicode.replace(/[{}]/g, ''),
      characters: characters,
      controversial: parseInt(entry.character_controversial_degree),
      related: entry.related_search.map(o => o.related_bian_hao),
      ref: entry.ref,
      pinyin: entry.character.replace(/[\u4e00-\u9fff]/g, (char) => pinyin(char, { toneType: 'num' })),
      jyutping: entry['jyut++'],
      IPA: '',
      strokes: '',
      head: entry.head,
      tail: entry.tail,
      meanings: entry.meanings.map(m => transMeaning(m))
    });
  }
  fs.writeFileSync(`./data/${name}.json`, JSON.stringify(dbt, null, 2));
}

const oldMeaningKeys = ['descriptions', 'words'];

function transMeaning(meaning) {
  checkKey(oldMeaningKeys, meaning);
  return {
    descriptions: meaning.descriptions,
    words: meaning.words.map(w => transWord(w))
  };
}

const oldWordKeys = [
  'prefix',
  'suffix',
  'descriptions',
  'sentences'
];

function transWord(word) {
  checkKey(oldWordKeys, word);
  return {
    format: `${word.prefix}__self__${word.suffix}`,
    descriptions: word.descriptions,
    sentences: Object.prototype.hasOwnProperty.call(word, 'sentences')
      ? word.sentences.map(s => transSententce(s))
      : []
  };
}

const oldSentenceKeys = ['prefix', 'suffix', 'descriptions'];

function transSententce(sentence) {
  checkKey(oldSentenceKeys, sentence);
  return {
    format: `${sentence.prefix}__self__${sentence.suffix}`,
    descriptions: sentence.descriptions,
  };
}

transSubDB('WriteableChars', 'Uword');
transSubDB('UnwriteableChars', 'Aword');
transSubDB('WriteableWords', 'Wword');
transSubDB('Pended', 'Pend');
