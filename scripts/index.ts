import fs from 'fs';
import path from 'path';
import { DB, exportDB } from './utilities';
import { isEntry } from './checkSJON';
import { Entry } from '../types/index';

const dataDir = './data';

function getDBNames(dir: string): string[] {
  const dbNames: string[] = [];
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const isDirectory = fs.statSync(filePath).isDirectory();
    if (isDirectory) {
      // 如果是目录，则递归读取
      getDBNames(filePath);
    } else {
      // 如果是.json文件，则提取文件名（不包含扩展名）
      if (filePath.endsWith('.json')) {
        dbNames.push(path.basename(filePath, '.json'));
      }
    }
  });
  return dbNames;
}

function autoDeclare() {
  let content = `// 自动生成的类型声明文件\n`;
  content += `export type DBName = \n\t| '${getDBNames(dataDir).join("'\n\t| '")}'\n;`;
  fs.writeFileSync('./types/autoExportTypes.d.ts', content);
}

autoDeclare();

console.log('类型声明文件生成完毕。');

const db = new DB('Pended');
console.log(isEntry(db.getEntry('P+1-bbaa2caa2') as Entry));
db.listEntryProps(['head', 'tail']);

exportDB();
