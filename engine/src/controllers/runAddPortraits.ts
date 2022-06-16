import { addPortraits } from '../services/addPortraits'
import { loadImagesFromFolder, db } from '../utils/utils';
import * as path from "path";

(async () => {

    const goniPortraits = await loadImagesFromFolder(path.resolve(path.dirname('..'))+'/portraits/goni')
    const inbarPortraits = await loadImagesFromFolder(path.resolve(path.dirname('..'))+'/portraits/inbar')
    await addPortraits(db.users.yonatan, db.persons.goni, goniPortraits)
    await addPortraits(db.users.yonatan, db.persons.inbar, inbarPortraits)

})()
