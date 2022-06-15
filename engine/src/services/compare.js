import { rekognitionClient, CompareFacesCommand } from '../utils/aws.js'

/* user - the app {id, name},
* person - the {id, name}
* medais - [{mimetype, data, metadata:{origFile}}]
*/
const findMatch = async (user, person, sourceMedia, targetMedia) => {
    const matches = []
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
            console.log(`matched with ${targetMedia.metadata.origFile} @ ${m.Face.Confidence}  `)
            matches.push(targetMedia.metadata.origFile)
        })
    }

    return [...new Set(matches)]

}


const compare = async (user, person, portraitsMedia, gallaryMedia) => {

    let i = 0;
    let j = 0;
    let matches = []
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

export { compare }