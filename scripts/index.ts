import fs from "fs";
import path from 'path';
import { DB } from "./utilities.js";

const dataDir = './data';
const dbNames: string[] = [];

function getNames(dir: string) {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const isDirectory = fs.statSync(filePath).isDirectory();
    if (isDirectory) {
      // 如果是目录，则递归读取
      getNames(filePath);
    } else {
      // 如果是.json文件，则提取文件名（不包含扩展名）
      if (filePath.endsWith('.json')) {
        dbNames.push(path.basename(filePath, '.json'));
      }
    }
  });
}

function generateTypeDeclaration() {
  let content = `// 自动生成的类型声明文件\n`;
  content += `export type DBName = \n\t| '${dbNames.join("'\n\t| '")}'\n;`;
  fs.writeFileSync('./types/autoExportTypes.d.ts', content);
}

getNames(dataDir);
generateTypeDeclaration();

console.log('类型声明文件生成完毕。');

const db = new DB('Pended');
db.listEntryProps(['head', 'tail']);
