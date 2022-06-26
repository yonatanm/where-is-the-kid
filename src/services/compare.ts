import { rekognitionClient, CompareFacesCommand } from '../utils/aws.js'
import { IUser, IPerson, IMedia } from '../types'

const findMatch = async (user: IUser, person: IPerson, sourceMedia: IMedia, targetMedia: IMedia) => {
    try {
        const res = await rekognitionClient.send(new CompareFacesCommand({
            SourceImage: {
                Bytes: sourceMedia.data
            },
            TargetImage: {
                Bytes: targetMedia.data
            },
            SimilarityThreshold: 70,


        }));
        if (res.FaceMatches && res.FaceMatches.length > 0) {
            return true
        }
        return false;
    }
    catch (ex) {
        console.error("got error comparing, next")
        return false
    }
}


const compare = async (user: IUser, person: IPerson, portraitsMedia: IMedia, gallaryMedia: IMedia[]) => {

    let matches: string[] = []
    let i = 0
    for (let g of gallaryMedia) {
        const isThereMatch = await findMatch(user, person, portraitsMedia, g)
        if (isThereMatch) {
            matches.push(g.metadata.externalId || '__' + i + '___')
        }
    }
    return matches;
}

const compareService = { compare }
export { compareService }