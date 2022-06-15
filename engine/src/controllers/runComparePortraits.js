import { comparePortraits } from './comparePortraits.js'
import { loadImagesFromFolder, db } from './utils.js';
import * as path from "path";


(async () => {
    const goniPortraits = await loadImagesFromFolder(path.resolve(path.dirname('..'))+'/portraits/goni')
    const inbarPortraits = await loadImagesFromFolder(path.resolve(path.dirname('..'))+'/portraits/inbar')
    const gallary = await loadImagesFromFolder(path.resolve(path.dirname('..') + '/gallary'))
    comparePortraits(db.users.yonatan, db.persons.inbar, inbarPortraits, gallary)
})()
