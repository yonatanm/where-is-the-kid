import { compare } from '../services/compare.js'
import { loadImagesFromFolder, db } from '../utils/utils.js';
import * as path from "path";


(async () => {
    const inbarPortraits = await loadImagesFromFolder(path.resolve(path.dirname('..'))+'/portraits/inbar')
    const goniPortraits = await loadImagesFromFolder(path.resolve(path.dirname('..'))+'/portraits/goni')

    const gallary = await loadImagesFromFolder(path.resolve(path.dirname('..') + '/gallary'))
    compare(db.users.yonatan, db.persons.goni, goniPortraits, gallary)
})()
