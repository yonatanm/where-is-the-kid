import * as qrcode from 'qrcode-terminal'
import WAWebJS, { ChatId, GroupParticipant, Client, LocalAuth, Message, MessageMedia, Chat, ChatTypes, MessageTypes, GroupChat } from 'whatsapp-web.js'
import { compareService } from '../services/compare'
import { imageUrlToBase64, db, runWithContext, simulateWithContext } from '../utils/utils'
import { IMedia, } from '../types';

import 'dotenv/config'

const toContactId = (num: string) => `${num}@c.us`
const toGroupId = (num: string) => `${num}@g.us`

//contacts
const BOT_ID = toContactId(process.env.BOT_NUM || 'NO_BOT_NUM')

const USER_AGENT = process.env?.USER_AGENT || undefined

const myClients = [new Client({
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
    userAgent: USER_AGENT,
    authStrategy: new LocalAuth({clientId:"client_0"}),
})]

myClients.forEach(async (client: Client, id: number) => {

      client.on("qr", (qr: string) => {
        handleQR(qr)
    });

    client.on("authenticated", () => {
        handleAuthenticated()
    });

    client.on("message", (message: WAWebJS.Message) => {
        runWithContext((theClient: Client, msg: WAWebJS.Message) => {
            handleMessage(client, msg)
        }, client, message)
    })
    await client.initialize()
})

const handleQR = (qr: string) => {
    console.log('qr is ', qr)
    qrcode.generate(qr, { small: true }, (qrcode) => { console.log(`\n${qrcode}`) });
}

const handleAuthenticated = () => {
    console.log(`client is AUTHENTICATED`)
}

const isFaceGroup = (group: GroupChat) => {
    return group.name.trim().toLocaleLowerCase().includes('witk') && group?.owner?._serialized === BOT_ID
}

const getFaceGroupsForContactId = async (client: Client, groupChatId: string, participantId: string): Promise<string[]> => {
    const commonGroupsIds: string[] = (await client.getCommonGroups(participantId)).map(g => g._serialized).filter(id => id !== groupChatId)

    const groups: GroupChat[] = []
    for (let gid of commonGroupsIds) {
        groups.push(await client.getChatById(gid) as GroupChat)
    }

    return groups.filter(gr => isFaceGroup(gr)).map(gr => gr.id._serialized)
}

const getFaceGroupsForParticipants = async (client: Client, groupChatId: string, participantsIds: string[]) => {
    let allFacegroups: string[] = []
    for (let participantId of participantsIds) {
        const faceGroups = await getFaceGroupsForContactId(client, groupChatId, participantId)
        faceGroups.forEach(fg => allFacegroups.push(fg))
    }
    return [...new Set(allFacegroups)]
}


const handleMessage = async (client: Client, message: WAWebJS.Message) => {
    try {
        const chat = await message.getChat()

        if (!message.hasMedia || message.type !== MessageTypes.IMAGE) {
            console.log('no image. skip')
            return
        }

        if (chat.isGroup) {
            const groupChat = (chat as GroupChat)
            
            console.log("got a message to group " + chat.name)

            //ignore messages to the group I created unless it start
            if (groupChat.name.toLocaleLowerCase().includes('witk') && (chat as GroupChat).owner && groupChat.owner._serialized === BOT_ID) {
                console.log(`this is a 'witk' gorup that bot owns. skip`)
                return
            }
            if (!groupChat.participants || groupChat.participants.length === 0) {
                console.log("no participants. skip")
                return
            }
        } else {
            const contact = await chat.getContact()
            console.log("got a direct message from " + contact.name||contact.id._serialized )
        }

        // so we are in a group not created by the bot and got a message with media.
        // we need to find all contacts that are our users

        await orchestrate(client, chat, message)
    }
    catch (ex) {
        console.error("got error handling message ", ex)
    }
}


const orchestrate = async (client: Client, chat: Chat, message: Message) => {
    console.log("# We have some work todo")
    let faceGroupIds = null
    const groupParticipantsIds = (chat.isGroup) ? (chat as GroupChat).participants.map(p => p.id._serialized).filter(p => p !== BOT_ID)
        : [(await chat.getContact()).id._serialized]
    faceGroupIds = await getFaceGroupsForParticipants(client, chat.id._serialized, groupParticipantsIds);

    let matches = 0
    for (let fgId of faceGroupIds) {
        const faceGroupChat = (await client.getChatById(fgId)) as GroupChat
        console.log(`..working on face group ${faceGroupChat.name}`)
        if (faceGroupChat.archived) {
            console.log('....archived group. skip');
            continue
        }
        const faceUrl = await client.getProfilePicUrl(fgId)
        if (!faceUrl) {
            console.log('....not faceUrl. skip')
            continue
        }
        // console.log("we have a faceUrl")
        const msgMedia = await message.downloadMedia()

        if (!msgMedia) {
            console.log("...couldn't donwload the media. skip")
            continue;
        }

        const faceImageAsBase64 = await imageUrlToBase64(faceUrl)
        console.log("...running comparison")
        const resMedia = await invokeComparison({ faceImageAsBase64, message, msgMedia, groupId: faceGroupChat.id._serialized })
        if (!resMedia || resMedia.length === 0) {
            console.log('..@ there is no match')
            continue
        }
        console.log(`..* BINGO ! we have a match fron ${faceGroupChat.name} to ${faceGroupChat.name}`)
        matches++
        await message.forward(fgId)
        const sender = await message.getContact()
        // form ${groupChat.name} sent by ${sender.id.user}
        if (chat.isGroup) {
            await faceGroupChat.sendMessage(`נשלח ע"י @${sender.id.user} בקבוצה ${(chat as GroupChat).name}`, { mentions: [sender] })
        } else {
            await faceGroupChat.sendMessage(`נשלח ע"י @${sender.id.user}`, { mentions: [sender] })
        }
    }
    if (matches === 0) {
        console.log(`~ We had no ${matches} matches`)
    } else {
        console.log(`$ We had ${matches} matches`)
    }

}

const doGetStatus = async (client: Client) => {
    let connected
    let { info } = client
    try {
        connected = await client.isRegisteredUser(BOT_ID);
    } catch (ex) {
        if (ex.message && ex.message.includes('Session closed. Most likely the page has been closed')) {
            console.info('** session closed')
            connected = false;
        }
        else {
            console.error(`failed to check is ${BOT_ID} is registered, so I guess we are not connected`, ex)
        }
    }
    return { connected, info }
}

const getStatus = async () => doGetStatus(myClients[0])

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
    const client = myClients[0]
    simulateWithContext(async (n: string) => {
        const chats = (await client.getChats()).filter(c => c.name == n)
        if (chats.length === 0) {
            console.log(`could find chat named ${n} to simulate. skip`)
            return
        }
        doSimulate(client, chats[0].id._serialized)
    }, name)
}

const doSimulate = async (client: Client, chatId: string) => {
    console.log(`simulation chatId: [${chatId}]`)
    const x = (await client.getChats()).filter(c => c.isGroup).map(c => ((c as unknown) as GroupChat))
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
    await orchestrate(client, gr, msg)

}


export { simulate, getStatus }