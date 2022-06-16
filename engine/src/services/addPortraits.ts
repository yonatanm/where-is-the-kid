import { s3, PutObjectCommand } from '../utils/aws'
import {IUser, IPerson, IMedia} from '../types'

async function uploadPortraitToS3(user : IUser, person : IPerson, media : IMedia, fullPath: string) {
    console.log('uploading ', fullPath)
    try {
        await s3.send(new PutObjectCommand({
            Bucket: 'dev.portraits',
            Key: fullPath,
            Body: media.data
        }))
    }
    catch (ex) {
        console.error('got error', ex)
    }
}

const addPortraits = async (user : IUser, person : IPerson, medias : IMedia[]) => {
    let i = 0;
    for (let media of medias) {
        const fullPath = `${person.id}_${person.name}/${i}.jpg`
        await uploadPortraitToS3(user, person, media, fullPath)
        i++;
    }
}

export { addPortraits }