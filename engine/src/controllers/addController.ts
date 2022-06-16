import { addService } from '../services/addPortraits'
import { loadImagesFromFolder, db } from '../utils/utils';
import * as path from "path";

const add = async () => {

    const goniPortraits = await loadImagesFromFolder(path.resolve(path.dirname('..')) + '/portraits/goni')
    const inbarPortraits = await loadImagesFromFolder(path.resolve(path.dirname('..')) + '/portraits/inbar')
    await addService.add(db.users.yonatan, db.persons.goni, goniPortraits)
    await addService.add(db.users.yonatan, db.persons.inbar, inbarPortraits)

}

const addController = { add }
export { addController }
