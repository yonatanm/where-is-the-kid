import { compareService } from '../services/compare'
import { loadImagesFromFolder, db } from '../utils/utils';
import * as path from "path";
import { IMedia } from '../types'


// const compare = async () => {
//     const inbarPortraits = await loadImagesFromFolder(path.resolve(path.dirname('..')) + '/portraits/inbar')
//     const goniPortraits = await loadImagesFromFolder(path.resolve(path.dirname('..')) + '/portraits/goni')

//     const gallary = await loadImagesFromFolder(path.resolve(path.dirname('..') + '/gallary'))
//     compareService.compare(db.users.yonatan, db.persons.goni, goniPortraits, gallary)
// }

const extractMadiasFrormRequest = (files: any, filedName: string) => {
    return (files[filedName] as any[]).map(a => ({
        data: a.buffer,
        mimetype: a.mimetype,
        metadata: {
            origFile: a.originalname
        }
    }));
}
const compare = async (files: any, formData: { userId: 'yonatan', personId: 'goni' | 'inbar' }) => {

    const portraits: IMedia[] = extractMadiasFrormRequest(files, 'portraits')
    const gallary: IMedia[] = extractMadiasFrormRequest(files, 'gallary')

    compareService.compare(db.users[formData.userId], db.persons[formData.personId], portraits, gallary)
}
const compareController = { compare }

export { compareController }
