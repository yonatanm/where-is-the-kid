import { compareService } from '../services/compare'
import { loadImagesFromFolder, db } from '../utils/utils';
import * as path from "path";


const compare = async () => {
    const inbarPortraits = await loadImagesFromFolder(path.resolve(path.dirname('..')) + '/portraits/inbar')
    const goniPortraits = await loadImagesFromFolder(path.resolve(path.dirname('..')) + '/portraits/goni')

    const gallary = await loadImagesFromFolder(path.resolve(path.dirname('..') + '/gallary'))
    compareService.compare(db.users.yonatan, db.persons.goni, goniPortraits, gallary)
}

const compareController = { compare }
export { compareController }
