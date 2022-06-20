interface IUser {
    id: string
    name: string
}

interface IPerson {
    id: string
    name: string
}

interface IMedia {
    mimetype?: string
    data: Buffer,
    metadata: {
        origFile: string
        externalId? : string
    }
}

export {IUser, IPerson, IMedia}