import fs from 'fs';
import path from 'path';

import { DBName } from '../types/autoExportTypes.js';
import { DataBase, Creator, Entry } from '../types/index.js';

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
  return JSON.parse(fs.readFileSync(`./data/${dbName}.json`, 'utf-8'));
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
        createTime: new Date().toUTCString(),
        updateTime: new Date().toUTCString(),
        creators: [],
        data: []
      };
    }
  }
  /**
   * 保存数据库到文件
   */
  save() {
    this.innerDB.updateTime = new Date().toUTCString();
    fs.writeFileSync(`./data/${this.innerDB.name}.json`, JSON.stringify(this.innerDB, null, 2));
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
  hasEntry(idOrJyutping: string, strict: boolean = true){
    return strict
      ? this.innerDB.data.some(entry =>
        entry.id === idOrJyutping || entry.jyutping === idOrJyutping
      )
      : this.innerDB.data.some(entry => 
        entry.id.includes(idOrJyutping) || entry.jyutping.includes(idOrJyutping)
      );
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
    const output = {};
    for (const key of keys) {
      if (key) {
        output[key] = new Set();
      }
    }
    for (const entry of this.innerDB.data) {
      for (const key in output) {
        output[key].add(entry[key]);
      }
    }
    for (const key in output) {
      output[key] = Array.from(output[key]);
    }
    fs.writeFileSync('./test/output.json', JSON.stringify(output, null, 2));
  }
}

type EntryKeys = {
  [Key in keyof Entry]?: Key;
}[keyof Entry][];

export {
  parseDB,
  DB
};
