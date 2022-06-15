import { s3, PutObjectCommand } from '../utils/aws.js'

/* user - the app {id, name},
* person - the {id, name}
* medais - [{mimetype, data, metadata:{origFile}}]
*/

//aws s3 cp $BASE/portraits/$1  s3://dev.portraits/$1 --recursive
async function uploadPortraitToS3(user, person, media, fullPath) {
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

const addPortraits = async (user, person, medias) => {
    let i = 0;
    for (let media of medias) {
        const fullPath = `${person.id}_${person.name}/${i}.jpg`
        await uploadPortraitToS3(user, person, media, fullPath)
        i++;
    }
}

export { addPortraits }