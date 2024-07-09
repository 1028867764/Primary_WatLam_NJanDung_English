import fs from 'fs';
import path from 'path';

import { DBName } from '../types/autoExportTypes';
import { DataBase, Creator, Entry } from '../types/index';

/**
 * 将`data`以JOSN格式写出到`path`
 * @param path 输出路径，可使用相对项目的路径，需带.json拓展名
 * @param data 写入的数据，请自行确保有效性
 */
// eslint-disable-next-line
function writeJSON(path: string, data: any) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 读取指定路径的JOSN文件为object
 * @param path 读取路径，可以使用相对项目的路径，需带.json拓展名
 * @returns 读出的对象
 */
function readJSON(path: string) {
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

function now() {
  return new Date().toISOString();
}

/**
 * 读取任意数据库的实用函数
 * @param args 有效的数据库名
 * @returns 以数据库名为键、数据库对象为值的object
 */
function parseDB(...args: DBName[]) {
  const dbs: { [key: string]: DataBase } = {};
  if (args.length === 0) {
    fs.readdirSync('./data').forEach(file => {
      const dbName = path.basename(file, '.json') as DBName;
      dbs[dbName] = _parseDB(dbName);
    });
  } else {
    for (const dbName of args) {
      dbs[dbName] = _parseDB(dbName);
    }
  }
  return dbs;
}

function _parseDB(dbName: DBName): DataBase {
  return readJSON(`./data/${dbName}.json`);
}

/**
 * 合并所有词条到`test/main.ts`，并解决所有引用
 */
function exportDB() {
  const dbs = parseDB();
  const mainDB = new DB('main');
  function solveIDRef(obj: object, path: string) {
    const [head, ...tail] = path.split('.');
    // 仅对末位属性赋值（跳过那些已经solve过的）
    if (tail.length === 0 && typeof obj[head] === 'string') {
      obj[head] = mainDB.solveIDRef(obj[head]);
    } else if (typeof obj[head] === 'object') {
      solveIDRef(obj[head], tail.join('.'));
    }
  }
  for (const dbName in dbs) {
    mainDB.innerDB.data = Object.assign(mainDB.innerDB.data, dbs[dbName].data);
  }
  for (const id in mainDB.innerDB.data) {
    const entry = mainDB.innerDB.data[id];
    const char = entry.characters[0];
    entry.meanings.forEach(meaning => {
      solveIDRef(meaning, 'descriptions.zh');
      solveIDRef(meaning, 'descriptions.en');
      meaning.words.forEach(word => {
        let wordFormat = char;
        if (typeof word.format === 'string') {
          wordFormat = word.format = word.format.replace(/__self__/g, char);
        }
        solveIDRef(word, 'format');
        word.sentences.forEach(sentence => {
          if (typeof sentence.format === 'string') {
            sentence.format = sentence.format.replace(/__self__/g, wordFormat);
          }
          solveIDRef(sentence, 'format');
          solveIDRef(sentence, 'descriptions.zh');
          solveIDRef(sentence, 'descriptions.en');
        });
      });
    });
    if (Array.isArray(entry.refBy)) {
      entry.refBy.push(id);
      const refBy = mainDB.solveIDIndex(entry.refBy);
      Object.keys(refBy).forEach(refID => {
        const refEntry = mainDB.getEntry(refID) as Entry;
        refEntry.refBy = refBy;
        if (refID !== id) {
          Object.keys(entry).forEach(key => {
            if (!['pinyin', 'jyutping', 'head', 'tail', 'ref'].includes(key)) {
              refEntry[key] = entry[key];
            }
          });
        }
      });
    }
    if (Array.isArray(entry.related)) {
      entry.related.push(id);
      const related = mainDB.solveIDIndex(entry.related);
      Object.keys(related).forEach(relID => {
        mainDB.getEntry(relID)!.related = related;
      });
    }
  }
  mainDB.save('./test');
}

class DB {
  innerDB: DataBase;

  /**
   * @param dbName 数据库名
   * - 如果是有效的数据库名称，则载入该数据库
   * - 如果未填写或名称不存在，则新建一个数据库
   */
  constructor(dbName?: DBName | string) {
    if (typeof dbName === 'string' && fs.existsSync(`./data/${dbName}.json`)) {
      this.innerDB = parseDB(dbName as DBName)[dbName];
    } else {
      this.innerDB = {
        name: dbName === undefined ? 'newDatabase' : dbName,
        version: '0.0.1',
        createTime: now(),
        updateTime: now(),
        creators: [],
        data: {},
      };
    }
  }

  /**
   * 保存数据库到文件
   */
  save(path?: string) {
    this.innerDB.updateTime = now();
    writeJSON(
      `${path ? path : './data'}/${this.innerDB.name}.json`,
      this.innerDB
    );
  }

  /**
   * 新增一个作者
   * @param creator 一个Creator对象，它具有以下属性
   * - name 必要属性，名字
   * - email 可选属性，电子邮箱
   * - url 可选属性，你的个人主页
   */
  addCreator(creator: Creator) {
    this.innerDB.creators.push(creator);
  }

  /**
   * 判断是否存在某个entry
   * @param idOrJyutping id或者粤拼
   * @param strict 是否启用严格模式
   * - `true` 默认，寻找完全相等的id或粤拼
   * - `false` 只要id或粤拼中含有`idOrJyutping`，即视为命中
   */
  hasEntry(idOrJyutping: string, strict: boolean = true): boolean {
    return strict
      ? Object.hasOwnProperty.call(this.innerDB.data, idOrJyutping)
      : Object.keys(this.innerDB.data).some(id => id.includes(idOrJyutping));
  }

  /**
   * 获取某个id号
   * @param ids id号
   * @returns 该id号对应的词条，如果不存在则返回`undefined`
   */
  getEntry(ids: string): Entry | undefined;
  getEntry(ids: string[]): (Entry | undefined)[];
  getEntry(ids: string | string[]): unknown {
    if (Array.isArray(ids)) {
      return ids.map(id => this.getEntry(id));
    }
    return this.innerDB.data[ids];
  }

  /**
   * 新增一个词条
   * @param entry Entry 对象，具体定义见 `./types/index.d.ts`
   */
  setEnstry(id: string, entry: Entry) {
    this.innerDB.data[id] = entry;
  }

  /**
   * 将id[]解析为{id: char}的形式
   * @param ids id为元素的数组
   * @returns id为键名、对应character为键值的object
   */
  solveIDIndex(ids: string[]) {
    const idCharMap: { [id: string]: string } = {};
    for (const id of ids) {
      if (this.hasEntry(id)) {
        idCharMap[id] = this.getEntry(id)!.characters[0];
      }
    }
    return idCharMap;
  }

  /**
   * 将{ID}表达式转写为{ID=character}的形式，以便在网页中实现点击字符跳转
   * @param str 任意包含{ID}表达式的字符串
   * @returns 含{ID=character}表达式的字符串，若ID不存在，将返回ID的字符串
   */
  solveIDRef(text: string) {
    const regexp = /{([^}]+)}/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    const parts: (string | { id: string; char: string })[] = [];
    while ((match = regexp.exec(text)) !== null) {
      const expStart = regexp.lastIndex - match[0].length;
      // 当前match之前的文本
      if (lastIndex < expStart) {
        parts.push(text.slice(lastIndex, expStart));
      }
      const id = match[1];
      const entry = this.getEntry(id);
      // 当前match
      parts.push({
        id: id,
        char: entry ? entry.characters[0] : id
      });
      // 更新初始位置
      lastIndex = regexp.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  }

  /**
   * 将所有词条的某个属性值搜索出来并以JSON格式输出到`./test/output.json`
   * @param keys 要查询的属性名称
   */
  listEntryProps(keys: EntryKeys) {
    const properties = {};
    for (const key of keys) {
      if (key) {
        properties[key] = new Set();
      }
    }
    for (const id in this.innerDB.data) {
      const entry = this.innerDB.data[id];
      for (const key in properties) {
        properties[key].add(entry[key]);
      }
    }
    for (const key in properties) {
      properties[key] = Array.from(properties[key]);
    }
    writeJSON('./test/properties.json', properties);
  }
}

type EntryKeys = {
  [Key in keyof Entry]?: Key;
}[keyof Entry][];

export { writeJSON, readJSON, parseDB, exportDB, DB };
