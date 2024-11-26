interface DataBase {
  // 数据库名称
  name: string;
  // 版本，形如 /\d+\.\d+\.\d/
  version: string;
  // YYYY-MM-DD
  createTime: string;
  // YYYY-MM-DD
  updateTime: string;
  // 贡献者
  creators: Creator[];
  data: { [id: string]: Entry };
}

interface Creator {
  name: string;
  email?: string;
  url?: string;
}

interface Entry {
  unicode: string;
  // 按照可信度排序，字符不存在时留空
  characters: string[];
  // 主字的可信程度
  // 0 - 完全可信
  // 1 - 存在争议，但有惯用的写法
  // 2 - 存在争议，且未达成共识
  controversial: 0 | 1 | 2;
  // 关联字的ID
  related: string[] | { [id: string]: string };
  pinyin: string;
  jyutping: string;
  bbakLau: string;
  head: string;
  // 韵尾
  tail: string;
  // 同音异体字的id序列,仅需列在主字
  refBy: string[] | { [id: string]: string };
  meanings: Meaning[];
}

/**
 * 对于含有{id}表达式的字符串，它将在导出时转换为一个数组，
 * 其中{id}的位置被替换为{id: string; char: string}
 */
type TextList = (string | { id: string; char: string })[];

/**
 * 词/句的中英双语释义
 */
interface Descriptions {
  zh: string | TextList;
  en: string | TextList;
}

/**
 * 字的释义，以及该释义下的词语
 */
interface Meaning {
  descriptions: Descriptions;
  words: Word[];
}

/**
 * 词语的释义，及该释义下的例句
 */
interface Word {
  format: string | TextList;
  descriptions: Descriptions;
  sentences: Sentence[];
}

/**
 * 例句
 */
interface Sentence {
  format: string | TextList;
  descriptions: Descriptions;
}

type ValueType =
  | DataBase
  | Entry
  | Entry[]
  | Descriptions
  | Meaning
  | Meaning[]
  | Word
  | Word[]
  | Sentence
  | Sentence[]
  | string
  | string[]
  | ControversialDegree;

type ControversialDegree = 0 | 1 | 2;

// eslint-disable-next-line
type TypeGuard = (value: any) => value is ValueType;

export {
  Creator,
  DataBase,
  Entry,
  Descriptions,
  Meaning,
  Word,
  Sentence,
  TypeGuard,
  ControversialDegree
};
