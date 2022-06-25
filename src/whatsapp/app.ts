import * as qrcode from 'qrcode-terminal'
import WAWebJS, { GroupParticipant, Client, LocalAuth, Message, MessageMedia, Chat, ChatTypes, MessageTypes, GroupChat } from 'whatsapp-web.js'
import { compareService } from '../services/compare'
import { imageUrlToBase64, db } from '../utils/utils'
import { IMedia, } from '../types';


const toContactId = (num: string) => `${num}@c.us`
const toGroupId = (num: string) => `${num}@g.us`

//groups
const IMAABA_ID = toGroupId("972546519551-1515593791")
const EXPERMIMENTS_ID = toGroupId("120363023106759216")
const WITK_1_ID = toGroupId("120363043577969853")
const WHEREISTEKID = toGroupId("120363042389141612")


//contacts
const BOT_ID = toContactId('972546519551')
const ITAMAR_ID = toContactId('972556605181')
const SHAKHAF_ID = toContactId('972545944849')

const waClient = new Client({
    puppeteer: {
        // headless: !true,
        // executablePath: '/snap/bin/firefox',
        args: ['--no-sandbox'],
    },
    authStrategy: new LocalAuth(),
});


waClient.on("qr", (qr) => {
    console.log('qr is ', qr)
    qrcode.generate(qr, { small: true }, (qrcode) => { console.log(`\n${qrcode}`) }
    );
});


waClient.on("authenticated", () => {
    console.log("AUTHENTICATED");
});

waClient.on("ready", () => {
    console.log('Client is ready!');
});

const getFaceGroupsForContactId = async (participantId: string): Promise<string[]> => {
    const db = new Map()
    db.set(ITAMAR_ID, [WITK_1_ID, IMAABA_ID])
    return db.get(participantId) || []
}

const getFaceGroups = async () => {
    const chats = await waClient.getChats()
    console.log("\n" + JSON.stringify(chats.filter(c => c.isGroup && c)
        .filter(c => !c.isMuted && !c.archived)
        .map(c => ((c as unknown) as GroupChat)).filter(g => g.owner && g.owner._serialized === BOT_ID)
    ))
    return []

}

const getFaceGroupsForParticipants = async (participants: GroupParticipant[]) => {
    let allFacegroups: string[] = []
    for (let gp of participants) {
        const participantId = gp.id._serialized
        if (participantId === BOT_ID) { continue; }
        const faceGroups = await getFaceGroupsForContactId(participantId)
        faceGroups.forEach(fg => allFacegroups.push(fg))
    }
    return [...new Set(allFacegroups)]
}


waClient.on("message", async (message: WAWebJS.Message,) => {
    const chat = await message.getChat()

    if (!chat.isGroup) {
        console.log('currenlty we dont support direct messages')
    }
    const groupChat: GroupChat = chat as GroupChat
    if (groupChat.id._serialized !== EXPERMIMENTS_ID && groupChat.owner && groupChat.owner._serialized === BOT_ID) {
        console.log('currenly we dont support messages to our group')
        return
    }
    if (!message.hasMedia) {
        console.log('this message has no media')
        return
    }
    console.log('we got a message with media, we might have to do something')
    // so we are in a group not created by the bot and got a message with media.
    // we need to find all contacts that are our users

    await orchestrate(groupChat, message)
})

const orchestrate = async (groupChat: GroupChat, message: Message) => {
    const groupParticipants = groupChat.participants;
    console.log(`groupParticipants ${groupParticipants.map(p => p.id._serialized)}`)

    const faceGroups = await getFaceGroupsForParticipants(groupParticipants);
    console.log("faceGroups ", faceGroups)

    for (let fg of faceGroups) {
        console.log(`working on face group ${fg}`)
        const faceUrl = await waClient.getProfilePicUrl(fg)
        if (!faceUrl) {
            console.log('not portraitUrl, maybe it is the wrong group?')
            continue
        }
        console.log("we have a faceUrl", faceUrl)
        const msgMedia = await message.downloadMedia()
        if (!msgMedia) {
            console.log("couldn't donwload the media, skip it")
            continue;
        }

        const faceImageAsBase64 = await imageUrlToBase64(faceUrl)
        console.log("got the base64 of the face ", faceImageAsBase64.substring(0, 10))
        const resMedia = await invokeComparison({ faceImageAsBase64, message, msgMedia, groupId: groupChat.id._serialized })
        if (!resMedia || resMedia.length === 0) {
            console.log('there was no match')
            continue
        }
        console.log(`BINGO ! we have a match ${fg} ${JSON.stringify(resMedia)}`)
        await message.forward(fg)
    }
}

const getStatus = async () => {
    let reg = false
    try {
        reg = await waClient.isRegisteredUser(BOT_ID)
    } catch (ex) {
        console.info("failed to check is MY_NUM is registered, so I guess we are not connected")
    }
    return { connected: reg }
}

const simulate = async () => {
    const x = (await waClient.getChats()).filter(c => c.isGroup).map(c => ((c as unknown) as GroupChat))
    // const y = x.filter(gc => gc.owner && gc.owner._serialized === BOT_ID)
    // console.log("\n" + JSON.stringify(y))
    // return
    const gr = x.filter(gc => gc.id._serialized === EXPERMIMENTS_ID)[0]
    const groupId = gr.id._serialized
    console.log(`simulating group ${gr.name} ${groupId}`)
    let i = 0;
    let messages, msg
    while (true) {
        if (i >= 10) break;
        messages = await gr.fetchMessages({ limit: 1 })
        if (messages && messages.length > 0 && messages[messages.length - 1].hasMedia) {
            msg = messages[messages.length - 1];
            break
        }
        i++;
    }
    if (!msg) {
        console.log('could find a message with media')
        return
    }
    console.log(`found a msg from ${msg.timestamp} to simulate ... lets start`)
    await orchestrate(gr, msg)
}

const invokeComparison = async ({ faceImageAsBase64, message, msgMedia, groupId }: { faceImageAsBase64: string, message: Message, msgMedia: MessageMedia, groupId: string }) => {
    const portrait: IMedia = {
        data: Buffer.from(faceImageAsBase64, "base64"),
        metadata: { origFile: groupId, externalId: groupId }
    }
    const gallary: IMedia[] = [{
        data: Buffer.from(msgMedia.data, "base64"),
        metadata: { origFile: message.mediaKey || 'origFile', externalId: message.mediaKey || 'mediaKey' }
    }]
    const compareRes: string[] = await compareService.compare(db.users.yonatan, { id: 'xyz', name: 'xyz' },
        portrait, gallary);
    return compareRes
}


console.log('waClient initialize')
waClient.initialize().then(() => { console.log('after init') })


export { getFaceGroups, simulate, getStatus }

