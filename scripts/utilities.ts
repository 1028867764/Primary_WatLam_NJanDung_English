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

/**
 * 合并所有词条到`test/main.ts`
 */
function mergeDB() {
  const dbs = parseDB();
  const mainDB = new DB('mian.db');
  for (const key in dbs) {
    mainDB.innerDB.data.push(...dbs[key].data);
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
        data: []
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
      ? this.innerDB.data.some(entry =>
        entry.id === idOrJyutping || entry.jyutping === idOrJyutping
      )
      : this.innerDB.data.some(entry => 
        entry.id.includes(idOrJyutping) || entry.jyutping.includes(idOrJyutping)
      );
  }

  /**
   * 获取某个id号
   * @param ids id号
   * @returns 该id号对应的词条，如果不存在则返回`undefined`
   */
  getEntry(ids: string): Entry | string;
  getEntry(ids: string[]): (Entry | string)[];
  getEntry(ids: string | string[]): unknown {
    if (Array.isArray(ids)) {
      return ids.map(id => this.getEntry(id));
    }
    return this.innerDB.data.find(entry => entry.id = ids);
  }

  /**
   * 新增一个词条
   * @param entry Entry 对象，具体定义见 `./types/index.d.ts`
   */
  addEnstry(entry: Entry) {
    if (!this.hasEntry(entry.id)) {
      this.innerDB.data.push(entry);
    }
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
    for (const entry of this.innerDB.data) {
      for (const key in properties) {
        properties[key].add(entry[key]);
      }
    }
    for (const key in properties) {
      properties[key] = Array.from(properties[key]);
    }
    writeJSON('./test/properties.json', properties);
  }

  /**
   * 创建一个以id索引entry的object，输出到`./date/*.json`
   * @returns 返回上述object
   */
  genIDIndex() {
    const index = {};
    this.innerDB.data.forEach(entry => {
      index[entry.id] = entry;
    });
    writeJSON(`./data/${this.innerDB.name}.index.json`, index);
    return index;
  }
}

type EntryKeys = {
  [Key in keyof Entry]?: Key;
}[keyof Entry][];

export {
  writeJSON,
  readJSON,
  parseDB,
  mergeDB,
  DB
};
