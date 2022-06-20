import { searchService } from '../services/search'
import { loadImagesFromFolder, db } from '../utils/utils';
import * as path from "path";


const search = async () => {
    const gallary = await loadImagesFromFolder(path.resolve(path.dirname('') + '/gallary'))
    searchService.search(db.users.yonatan, db.persons.inbar, gallary)
}

const searchController = { search }
export { searchController }
