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
    data: any,
    metadata: {
        origFile: string
    }
}

export {IUser, IPerson, IMedia}