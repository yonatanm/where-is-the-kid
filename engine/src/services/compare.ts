import { rekognitionClient, CompareFacesCommand } from '../utils/aws.js'
import { IUser, IPerson, IMedia } from '../types'

const findMatch = async (user: IUser, person: IPerson, sourceMedia: IMedia, targetMedia: IMedia) => {
    const matches: string[] = []
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
        res.FaceMatches.forEach((m) => {
            console.log(`matched with ${targetMedia.metadata.origFile} @ ${m?.Face?.Confidence}  `)
            matches.push(targetMedia.metadata.origFile)
        })
    }

    return [...new Set(matches)]

}


const compare = async (user: IUser, person: IPerson, portraitsMedia: IMedia[], gallaryMedia: IMedia[]) => {

    let i = 0;
    let j = 0;
    let matches: string[] = []
    for (let p of portraitsMedia) {
        j = 0;
        for (let g of gallaryMedia) {
            console.log(` comparing with ${p.metadata.origFile} and ${g.metadata.origFile}`)
            matches = matches.concat(await findMatch(user, person, p, g))
        }
        i++
    }
    matches = [...new Set(matches)];
    console.log("MATCHES ", matches)
    return matches
}

const compareService = { compare }
export { compareService }