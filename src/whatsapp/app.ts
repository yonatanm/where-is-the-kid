import * as qrcode from 'qrcode-terminal'
import WAWebJS, { ChatId, GroupParticipant, Client, LocalAuth, Message, MessageMedia, Chat, ChatTypes, MessageTypes, GroupChat } from 'whatsapp-web.js'
import { compareService } from '../services/compare'
import { imageUrlToBase64, db, runWithContext, simulateWithContext } from '../utils/utils'
import { IMedia, } from '../types';

import 'dotenv/config'

const toContactId = (num: string) => `${num}@c.us`
const toGroupId = (num: string) => `${num}@g.us`

//groups
const EXPERMIMENTS_ID = toGroupId(process.env.EXPERMINETS_GROUP_ID || 'EXPERMINETS_GROUP_ID')


//contacts
const BOT_ID = toContactId(process.env.BOT_NUM || 'NO_BOT_NUM')

const waClient = new Client({
    puppeteer: {
        // headless: !true,
        // executablePath: '/snap/bin/firefox',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
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


waClient.on("message", (message: WAWebJS.Message) => {
    runWithContext((msg: WAWebJS.Message) => {
        handleMessage(msg)
    }, message)
})


const getFaceGroupsForContactId = async (groupChatId: string, participantId: string): Promise<string[]> => {
    const commonGroupsIds: string[] = (await waClient.getCommonGroups(participantId)).map(g => g._serialized)
    const ids: string[] = []
    for (let gid of commonGroupsIds) {
        const group = await waClient.getChatById(gid) as GroupChat
        if (group.name.trim().toLocaleLowerCase().includes('witk')) {
            continue;
        }
        if (group.id._serialized === groupChatId) { // skip the originated group
            continue;
        }
        if (group.owner && group.owner._serialized === BOT_ID) // we have a face group
        {
            ids.push(gid)
        }
    }
    return ids;
}

const getFaceGroups = async () => {
    const chats = await waClient.getChats()
    console.log("\n" + JSON.stringify(chats.filter(c => c.isGroup && c)
        .filter(c => !c.isMuted && !c.archived)
        .map(c => ((c as unknown) as GroupChat)).filter(g => g.owner && g.owner._serialized === BOT_ID)
    ))
    return []

}

const getFaceGroupsForParticipants = async (groupChatId: string, participants: GroupParticipant[]) => {
    let allFacegroups: string[] = []
    for (let gp of participants) {
        const participantId = gp.id._serialized
        const faceGroups = await getFaceGroupsForContactId(groupChatId, participantId)
        faceGroups.forEach(fg => allFacegroups.push(fg))
    }
    return [...new Set(allFacegroups)]
}


const handleMessage = async (message: WAWebJS.Message) => {
    try {
        const chat = await message.getChat()

        if (!chat.isGroup) {
            console.log('not a group message. skip')
            return;
        }
        const groupChat: GroupChat = chat as GroupChat
        console.log("got a message to group " + groupChat.name)

        if (!message.hasMedia || message.type !== MessageTypes.IMAGE) {
            console.log('no image. skip')
            return
        }
        //ignore messages to the group I created unless it start
        if (groupChat.name.toLocaleLowerCase().includes('witk') && groupChat.owner && groupChat.owner._serialized === BOT_ID) {
            console.log(`this is a 'witk' gorup that bot owns. skip`)
            return
        }
        if (!groupChat.participants || groupChat.participants.length === 0) {
            console.log("no participants. skip")
            return
        }
        // so we are in a group not created by the bot and got a message with media.
        // we need to find all contacts that are our users

        await orchestrate(groupChat, message)
    }
    catch (ex) {
        console.error("got error handling message", ex)
    }
}


const orchestrate = async (groupChat: GroupChat, message: Message) => {
    console.log("We have some work todo")
    const groupParticipants = groupChat.participants.filter(p => p.id._serialized !== BOT_ID);
    const faceGroupIds = await getFaceGroupsForParticipants(groupChat.id._serialized, groupParticipants);

    for (let fgId of faceGroupIds) {
        const faceGroupChat = (await waClient.getChatById(fgId)) as GroupChat
        console.log(`...working on face group ${faceGroupChat.name}`)
        if (faceGroupChat.archived) {
            console.log('archived group. skip');
            continue
        }
        const faceUrl = await waClient.getProfilePicUrl(fgId)
        if (!faceUrl) {
            console.log('not portraitUrl. skip')
            continue
        }
        console.log("we have a faceUrl")
        const msgMedia = await message.downloadMedia()
        if (!msgMedia) {
            console.log("couldn't donwload the media. skip")
            continue;
        }

        const faceImageAsBase64 = await imageUrlToBase64(faceUrl)
        console.log("running comparison")
        const resMedia = await invokeComparison({ faceImageAsBase64, message, msgMedia, groupId: faceGroupChat.id._serialized })
        if (!resMedia || resMedia.length === 0) {
            console.log('@ there is no match')
            continue
        }
        console.log(`* BINGO ! we have a match fron ${faceGroupChat.name} to ${faceGroupChat.name}`)
        await message.forward(fgId)
        const sender = await message.getContact()
        // form ${groupChat.name} sent by ${sender.id.user}
        await faceGroupChat.sendMessage(`נשלח ע"י @${sender.id.user} בקבוצה ${groupChat.name}`, { mentions: [sender] })
    }
}

const getStatus = async () => {
    let reg = false
    let info = {}
    try {
        reg = await waClient.isRegisteredUser(BOT_ID)
        info = await waClient.info
    } catch (ex) {
        console.info("failed to check is MY_NUM is registered, so I guess we are not connected")
    }
    return { connected: reg, info }
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

const simulate = async (name: string) => {
    simulateWithContext(async (n: string) => {
        const chats = (await waClient.getChats()).filter(c => c.name == n)
        if (chats.length === 0) {
            console.log(`could find chat named ${n} to simulate. skip`)
            return
        }
        doSimulate(chats[0].id._serialized)
    }, name)
}

const doSimulate = async (chatId: string) => {
    console.log(`simulation chatId: [${chatId}]`)
    const x = (await waClient.getChats()).filter(c => c.isGroup).map(c => ((c as unknown) as GroupChat))
    const gr = x.filter(gc => gc.id._serialized === chatId)[0]
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

console.log('waClient initialize')
waClient.initialize()

export { getFaceGroups, simulate, getStatus }

