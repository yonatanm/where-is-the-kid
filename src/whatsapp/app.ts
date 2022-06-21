import * as qrcode from 'qrcode-terminal'
import WAWebJS, { Client, LocalAuth, Message, MessageMedia, Chat, ChatTypes, MessageTypes } from 'whatsapp-web.js'
import * as fs from "fs";
import { compareService } from '../services/compare'
import { db } from '../utils/utils'
import { IMedia } from '../types';


const ROTEM = '972556605181' //'972555573058'

const waClient = new Client({
    puppeteer: {
        headless: true,
        args: ['--no-sandbox'],
    },
    authStrategy: new LocalAuth(),
});


waClient.on("qr", (qr) => {
    console.log('qr is ', qr)
    qrcode.generate(qr, { small: true });
});

waClient.on("authenticated", () => {
    console.log("AUTHENTICATED");
});

waClient.on("ready", () => {
    console.log('Client is ready!');
});


waClient.on("message", async (message: WAWebJS.Message,) => {
    console.log("got message !", Object.keys(message))
    // console.log("got message", JSON.stringify(message))
    console.log("got from", message.from)
    if (message.body === "איפה הילד") {
        const chat = await waClient.getChatById(message.id.remote)
        const resMedia = await getChats(chat)

        for (let rm of resMedia) {
            if (rm.medias.length === 0) {
                await message.reply(`לא נמצאו תמונות של ${rm.name}`)
            } else {
                if (rm.medias.length === 1) {
                    await message.reply(`נמצאה תמונה אחת של ${rm.name}`)
                }
                await message.reply(`נמצאו ${rm.medias.length} תמונות של ${rm.name}`)
                for (let m of rm.medias) {
                    const media = await new MessageMedia(m.media.mimetype || "image/jpeg", m.media.data.toString('base64'), "image.jpg");

                    // await waClient.sendMessage(message.id.remote, '', {caption: `❤️${rm.name}❤️`} )
                    await waClient.sendMessage(message.id.remote, `❤️${rm.name}❤️`, { media: media })
                }
            }
        }


    }
})

const getPersonsAndMedia = async (chat: Chat) => {
    const messages = (await chat?.fetchMessages({ limit: 100 }))
    const repMessages = messages.filter((m) => m.type === 'chat' && m.body && m.body.trim().length > 0 && !m.body.includes('❤️') && m.hasQuotedMsg == true)

    const dict: { name: string, media: IMedia }[] = []
    let i = 0
    for (let m of repMessages) {
        const mediaMessage = await m.getQuotedMessage()
        if (mediaMessage.type !== MessageTypes.IMAGE) continue
        if (!mediaMessage.hasMedia) continue
        const mm = await mediaMessage.downloadMedia()

        const buffer = Buffer.from(mm.data, "base64");
        dict.push({ name: m.body.trim(), media: { data: buffer, mimetype: mm.mimetype, metadata: { origFile: mm.filename || '_' + i, externalId: mediaMessage.mediaKey || '' + i } } })
        i++;
    }


    return dict
}

const getAllMedias = async (chat: Chat) => {
    const messages: Message[] = (await chat?.fetchMessages({ limit: 20 }))
    console.log("### messages ", messages.length)// JSON.stringify(messages))
    const messagesWithMedia = messages.filter(m => m.type === MessageTypes.IMAGE && m.hasMedia)
    const gallary: { origMessage: Message, media: IMedia }[] = []
    let i = 0;
    let c = 0;
    console.log("messagesWithMedia length" + messagesWithMedia.length)
    for (let m of messagesWithMedia) {
        console.log("working on " + i)
        // if (i !== 2) {
        try {
            const mm = await m.downloadMedia()
            const buffer = Buffer.from(mm.data, "base64");

            gallary.push({ origMessage: m, media: { data: buffer, mimetype: mm.mimetype, metadata: { origFile: mm.filename || '_' + c, externalId: m.mediaKey || '_' + c } } })
            c++;
        }
        catch (ex) {
            console.error("got exception ", ex)
        }
        // }
        i++;
    }
    return gallary
}

const getChats = async (c?: Chat) => {
    const chat = c || (await waClient.getChats()).find(c => c.id._serialized === `${ROTEM}@c.us`)
    if (!chat) return []

    console.log('found chat', JSON.stringify(chat.id))

    let c1
    try {
        c1 = await waClient.getChatById(chat.id._serialized)
    } catch (ex) {
        console.error("error", ex)
    }
    console.log("c1", c1)

    const dict = await getPersonsAndMedia(chat)
    const names = dict.map(x => x.name)

    console.log("names is " + names)
    console.log("dict ", dict.map(x => x.media.metadata.origFile))
    console.log("dict length" + dict.length)
    const uniqueNames = [...new Set(names)]
    console.log("nauniqueNamesmes is " + uniqueNames)
    const allmedias = await getAllMedias(chat)
    console.log("allmedias ", allmedias.map(x => x.media.metadata.origFile))
    console.log("allmedias length " + allmedias.length)
    const gallary = allmedias.filter(am => dict.every(d => d.media.metadata.externalId !== am.media.metadata.externalId))
    console.log("gallary ", gallary.map(x => x.media.metadata.origFile))
    console.log("gallary length " + gallary.length)
    let res: { name: string, matches: string[] }[] = []
    for (let n of uniqueNames) {

        const portraits = dict.filter(x => x.name === n).map(x => x.media)
        console.log(`for name ${n} about to compart portriats ${portraits.length} in galary ${gallary.length}`)

        const compareRes: string[] = await compareService.compare(db.users.yonatan, { id: n, name: n },
            portraits, gallary.map(x => x.media));

        res.push({ name: n, matches: compareRes })
    }

    console.log('res ', res)

    const resMedia = res.map(x => {
        return {
            name: x.name,
            matches: x.matches,
            medias: allmedias.filter(am => x.matches.some(r => r === am.media.metadata.origFile))
        }
    })


    console.log("resMedia len " + resMedia.length)


    return resMedia;

    // const messages = (await chat?.fetchMessages({ limit: 2 }))
    // console.log('got message len', messages?.length)
    // return messages || []
}

console.log('waClient initialize')
waClient.initialize().then(() => { console.log('after init') })


export { getChats }

