import { search } from './services/search.js'
import { loadImagesFromFolder, db } from './utils/utils.js';
import * as path from "path";


(async () => {
    const gallary = await loadImagesFromFolder(path.resolve(path.dirname('') + '/gallary'))
    search(db.users.yonatan, db.persons.inbar, gallary)
})()
