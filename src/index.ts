import express, { response } from 'express'
import 'dotenv/config'
import { simulate, getStatus } from './whatsapp/app'
import { IHttpService, HttpService } from './services/http'
import { Image } from '@aws-sdk/client-rekognition'
const path = require('path')

const version = process.env.VERSION || 'dev'

const httpService = new HttpService()
const FACEBOOK_WEBHOOK_TOKEN = process.env.FACEBOOK_WEBHOOK_TOKEN || 'MISSING_FACEBOOK_WEBHOOK_TOKEN'
console.log(`we are on the air with version: ${version}`)

const server = express()
const port = process.env.PORT || process.env.APP_PORT

const asset = path.join(__dirname, '..', 'assets')

server.use(express.json());

server.use('/about', express.static(asset + '/about'));

server.use('/help', express.static(asset + '/about'));

server.post('/facebook-webhook', async (req, res) => {
    const whatsappPayload = req.body
    console.log(`got a mesage ${JSON.stringify(whatsappPayload)}`)
    const payloadExtractor = new CloudApiPayloadExtractor(whatsappPayload);
    const fromId = payloadExtractor.phoneNumberId;
    const sender = payloadExtractor.sender;
    const userInfo = payloadExtractor.userInfo;
    // console.log(`more info. from ${JSON.stringify(userInfo)} ${fromId} ${sender} ${payloadExtractor.messageType} ${JSON.stringify(payloadExtractor.message)}`)
    if (payloadExtractor.messageType == MessageTypes.Image) {
        const msg = payloadExtractor.message as ImageMessage
        const url = await httpService.getMediaUrl(msg.image.id)
    console.log('media url is', url)
    const image: Uint8Array = await httpService.downloadFile(url);
    const imageBuffer = Buffer.from(image)
        
    }

    res.sendStatus(200)
})


server.get('/facebook-webhook', function (req, res) {
    const requestToken = req.query['hub.verify_token']
    const requestChallange = req.query['hub.challenge']
    const requestMode = req.query['hub.mode']
    console.log(`got a facebook-webhook with mode ${requestMode} token ${requestToken} and challange ${requestChallange}`)
    if (requestMode === 'subscribe' && requestToken === FACEBOOK_WEBHOOK_TOKEN) {
        console.log('a vaid facebook-webhook')
        res.send(requestChallange);
    } else {
        console.log('something wrong with the facebook-webhook')
        res.sendStatus(400);
    }
});

server.get('/api/version', async (req, res) => {
    res.send(version)
})

server.get('/api/status', async (req, res) => {
    res.json(await getStatus())
})

server.get('/api/connected', async (req, res, next) => {
    const status = await getStatus()
    const connected = status?.connected
    if (connected) {
        res.sendStatus(200)
    } else {
        res.sendStatus(503)
    }
    console.log(`connected check: ${connected} from IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress} UA: ${req.headers['user-agent']}`)
})

server.get('/api/wa/simulate', async (req: any, res) => {
    await simulate(req.query?.name || '')
    res.json("OK")
})

server.listen(port, async () => {
    console.log('--- listeneing ---')

    console.log(`Example app listening on port ${port}  ${__dirname}`)
})




export interface Metadata {
    display_phone_number: string;
    phone_number_id: string;
}

export interface Profile {
    name: string;
}


export interface Contact {
    profile: Profile;
    wa_id: string;
}

export interface Value {
    messaging_product: string;
    metadata: Metadata;
    contacts: Contact[];
    messages: Message[];
}

export interface Change {
    value: Value | null;
    field: string;
}

export interface Entry {
    id: string;
    changes: Change[] | null;
}

export interface WhatsappMessagePayload {
    object: string;
    entry: Entry[] | null;
}


export enum MessageTypes {
    Audio = 'audio',
    Text = 'text',
    Sticker = 'sticker',
    Image = 'image',
    Location = 'location',
    Unknown = 'unknonw'
}


const CloudApiTypeToType = {
    audio: MessageTypes.Audio,
    text: MessageTypes.Text,
    image: MessageTypes.Image,
    sticker: MessageTypes.Sticker,
    location: MessageTypes.Location,
    unknown: MessageTypes.Unknown
};



export type MessageBody = {
    from: string;
    id: string;
    timestamp: string;
}

interface AudioMessageBody {
    mime_type: string;
    sha256: string;
    id: string;
    voice: boolean;
}

interface StickerMessageBody extends MessageBody {
    mime_type: string;
    sha256: string;
    id: string;
}

interface ErrorMessageBody extends MessageBody {
    code: number;
    details: string;
    title: string;
}

interface ImageMessageBody {
    caption: string;
    mime_type: string;
    sha256: string;
    id: string;
}

interface TextMessageBody {
    body: string;
}

interface ImageMessageBody {
    caption: string;
    mime_type: string;
    sha256: string;
    id: string;
}

interface LocationMessageBody {
    latitude: string;
    longitude: string;
    name: string;
    address: string;
}

export interface ImageMessage extends MessageBody {
    type: 'image';
    image: ImageMessageBody;
}

export interface TextMessage extends MessageBody {
    type: 'text';
    text: TextMessageBody;
}

export interface AudioMessage extends MessageBody {
    type: 'audio';
    audio: AudioMessageBody;
}

export interface LocationMessage extends MessageBody {
    type: 'location';
    location: LocationMessageBody;
}

export interface StickerMessage extends MessageBody {
    type: 'sticker';
    sticker: StickerMessageBody;
}

export interface AudioMessage extends MessageBody {
    type: 'audio';
    audio: AudioMessageBody;
}

export interface LocationMessage extends MessageBody {
    type: 'location';
    location: LocationMessageBody;
}

export interface StickerMessage extends MessageBody {
    type: 'sticker';
    sticker: StickerMessageBody;
}

export interface UnknownMessage extends MessageBody {
    type: 'unknown';
    errors: ErrorMessageBody[];
}


export type Message =
    AudioMessage
    | TextMessage
    | ImageMessage
    | LocationMessage
    | StickerMessage
    | UnknownMessage;



export interface UserInfo {
    userId: string;
    name: string;
}

class CloudApiPayloadExtractor {
    constructor(private readonly payload: WhatsappMessagePayload) {
    }

    get messageType(): string | null {
        const message = this.payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        // ^?
        if (message?.type) return (CloudApiTypeToType[message.type]);
        return null
    }

    get message(): Message | null {
        return this.payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0] || null;
    }

    get phoneNumberId(): string | null {
        return this.payload.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id || null;
    }

    get userInfo(): UserInfo | null {
        const maybeContact = this.payload.entry?.[0]?.changes?.[0].value?.contacts?.[0];
        return maybeContact ? {
            name: maybeContact.profile?.name || '',
            userId: maybeContact.wa_id
        } : null;
    }

    get sender(): string | null {
        return this.message?.from || null;
    }
}
