import { DB, exportDB } from './utilities';
import { isEntry } from './checkSJON';
import { Entry } from '../types/index';

const db = new DB('Pended');
console.log(isEntry(db.getEntry('P+1-bbaa2caa2') as Entry));
db.listEntryProps(['head', 'tail']);

exportDB();
