import { searchPortraits } from './services/searchPortraits.js'
import { loadImagesFromFolder, db } from './utils/utils.js';
import * as path from "path";


(async () => {
    const gallary = await loadImagesFromFolder(path.resolve(path.dirname('') + '/gallary'))
    searchPortraits(db.users.yonatan, db.persons.inbar, gallary)
})()
