import fs from 'fs';

const db = JSON.parse(fs.readFileSync('./deprecated/鬱字3.json', 'utf-8'));

console.log(Object.keys(db))

const heads = new Set();
const tails = new Set();

for (const dbName in db.data) {
  console.log(dbName);
  const entries = db.data[dbName];
  for (const entry of entries) {
    heads.add(entry.head);
    tails.add(entry.tail);
  }
}

const output = {
  chars: [].filter(v => v),
  heads: [...heads].filter(v => v),
  tails: [...tails].filter(v => v)
}

fs.writeFileSync('./test/HeadTails.json', JSON.stringify(output, null, 2), 'utf-8');
