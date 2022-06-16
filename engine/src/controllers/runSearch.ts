import { search } from '../services/search'
import { loadImagesFromFolder, db } from '../utils/utils';
import * as path from "path";


(async () => {
    const gallary = await loadImagesFromFolder(path.resolve(path.dirname('') + '/gallary'))
    search(db.users.yonatan, db.persons.inbar, gallary)
})()
