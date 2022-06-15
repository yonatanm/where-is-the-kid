import { compare } from '../services/compare.js'
import { loadImagesFromFolder, db } from '../utils/utils.js';
import * as path from "path";


(async () => {
    const inbarPortraits = await loadImagesFromFolder(path.resolve(path.dirname('..'))+'/portraits/inbar')
    const gallary = await loadImagesFromFolder(path.resolve(path.dirname('..') + '/gallary'))
    compare(db.users.yonatan, db.persons.inbar, inbarPortraits, gallary)
})()
