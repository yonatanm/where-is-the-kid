import { timeStamp } from '../utils/utils.js'
import { s3, rekognitionClient, PutObjectCommand, CreateCollectionCommand, DeleteCollectionCommand, IndexFacesCommand, SearchFacesByImageCommand, ListObjectsCommand } from '../utils/aws.js'

/* user - the app {id, name},
* person - the {id, name}
* medais - [{mimetype, data, metadata:{origFile}}]
*/

const getFullPath = (folder, i) => `${folder}/${i}.jpg`

const uploadimage = async (user, person, media, fullPath) => {
    try {
        await s3.send(new PutObjectCommand({
            Bucket: 'dev.gallary',
            Key: fullPath,
            Body: media.data
        }))
    }
    catch (ex) {
        console.error('failed upload', ex)
    }
}

const uploadGallary = async (user, person, medias, folder) => {
    let i = 0;
    for (let media of medias) {
        const fullPath = getFullPath(folder, i)
        await uploadimage(user, person, media, fullPath)
        i++;
    }
}

const indexGallary = async (user, person, medias, folder) => {
    // aws rekognition delete-collection --collection-id face-collection-gallary  --region us-east-1
    const collectionId = `collection-${folder}`
    try {
        await rekognitionClient.send(new DeleteCollectionCommand({
            CollectionId: collectionId
        }))
    } catch (ex) {
        // console.log("failed to deelete collection")
    }
    await rekognitionClient.send(new CreateCollectionCommand({
        CollectionId: collectionId
    }))
    // console.log("collection was created")

    let i = 0;
    for (let media of medias) {
        const fullPath = getFullPath(folder, i)
        console.log('indexing ' + fullPath)
        const fr = await rekognitionClient.send(new IndexFacesCommand({
            Image: {
                S3Object: {
                    Bucket: 'dev.gallary',
                    Name: fullPath
                }
            },
            CollectionId: collectionId,
            QualityFilter: 'AUTO',
            DetectionAttributes: ['ALL'],
            ExternalImageId: `${fullPath}_${media?.metadata?.origFile || ''}`.replace('/', '_'),
        }))
        // console.log('index-face-result ', JSON.stringify(fr))
        i++
    }
}
const findMatch = async (user, person, medias, folder) => {
    // aws rekognition search-faces-by-image  --image '{"S3Object":{"Bucket":"dev.portraits","Name":"'$P'"}}' 
    // --collection-id face-collection-gallary --face-match-threshold 70 --region us-east-1 | jq '.FaceMatches[].Face.ExternalImageId' |  tr -d '"' 
    const dirFullPath = `${person.id}_${person.name}`
    const ls = await s3.send(new ListObjectsCommand({
        Bucket: 'dev.portraits',
        Prefix: dirFullPath
    }))
    const matches = []
    if (ls.Contents && ls.Contents.length > 0) {
        for (let c of ls.Contents) {
            console.log('looking for ', c.Key)
            const res = await rekognitionClient.send(new SearchFacesByImageCommand({
                Image: {
                    S3Object: {
                        Bucket: 'dev.portraits',
                        Name: c.Key
                    }
                },
                FaceMatchThreshold: 70,
                CollectionId: `collection-${folder}`
            }))
            if (res.FaceMatches && res.FaceMatches.length > 0) {
                res.FaceMatches.forEach((m) => {
                    // console.log(`matched with ${m.Face.ExternalImageId} @ ${m.Face.Confidence}  `)
                    matches.push(m.Face.ExternalImageId)
                })
            }
        }
    }
    return [...new Set(matches)]

}


const searchPortraits = async (user, person, medias) => {
    const ts = timeStamp()
    const folder = `${user.id}_${user.name}_${ts}`

    console.log("uploading")
    await uploadGallary(user, person, medias, folder)
    console.log("indexing")
    await indexGallary(user, person, medias, folder)
    console.log("searching")
    const r = await findMatch(user, person, medias, folder)
    console.log('we have matches ', r)
}

export { searchPortraits }