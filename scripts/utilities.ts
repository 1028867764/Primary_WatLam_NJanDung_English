import fs from 'fs';
import path from 'path';

import { DBName } from '../types/autoExportTypes.js';
import { DataBase, Creator, Entry } from '../types/index.js';

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
    fs.readdirSync('./data').forEach((file) => {
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

function solveIDRef(str: string, source: DB) {
  return str.replace(
    /{(.+?)}/g,
    (match, id) => source.getEntry(id)?.characters[0] || match
  );
}

/**
 * 合并所有词条到`test/main.ts`，并解决所有引用
 */
function exportDB() {
  const dbs = parseDB();
  const mainDB = new DB('main');
  for (const dbName in dbs) {
    mainDB.innerDB.data = Object.assign(mainDB.innerDB.data, dbs[dbName].data);
  }
  for (const id in mainDB.innerDB.data) {
    const entry = mainDB.innerDB.data[id] as Entry;
    entry.meanings.forEach((meaning) => {
      meaning.descriptions.zh = solveIDRef(meaning.descriptions.zh, mainDB);
      meaning.descriptions.en = solveIDRef(meaning.descriptions.en, mainDB);
      meaning.words.forEach((word) => {
        word.format = word.format.replace(/__self__/g, entry.characters[0]);
        word.format = solveIDRef(word.format, mainDB);
        word.sentences.forEach((sentence) => {
          sentence.format = sentence.format.replace(/__self__/g, word.format);
          sentence.format = solveIDRef(sentence.format, mainDB);
          sentence.descriptions.zh = solveIDRef(sentence.descriptions.zh, mainDB);
          sentence.descriptions.en = solveIDRef(sentence.descriptions.en, mainDB);
        });
      });
    });
    const related: { [id: string]: string } = {};
    (entry.related as string[]).forEach((id) => {
      if (mainDB.hasEntry(id)) {
        related[id] = mainDB.getEntry(id)!.characters[0];
      }
    });
    entry.related = related;
  }
  for (const id in mainDB.innerDB.data) {
    const entry = mainDB.innerDB.data[id] as Entry;
    if (mainDB.hasEntry(entry.ref)) {
      const targetEntry = mainDB.getEntry(entry.ref) as Entry;
      targetEntry.refBy[entry.ref] = targetEntry.characters[0];
      targetEntry.refBy[id] = entry.characters[0];
      Object.keys(targetEntry).forEach((key) => {
        // 读音有关的属性不要迁移
        if (![
          'pinyin',
          'jyutping',
          'head',
          'tail',
          'ref',
        ].includes(key)) {
          entry[key] = targetEntry[key];
        }
      });
      mainDB.setEnstry(entry.ref, targetEntry);
    }
    mainDB.setEnstry(id, entry);
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
        data: {}
      };
    }
  }

  /**
   * 保存数据库到文件
   */
  save(path?: string) {
    this.innerDB.updateTime = now();
    writeJSON(`${path ? path : './data'}/${this.innerDB.name}.json`, this.innerDB);
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

export {
  writeJSON,
  readJSON,
  parseDB,
  exportDB,
  DB
};
