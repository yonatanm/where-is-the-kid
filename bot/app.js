const qrcode = require("qrcode-terminal");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");

const client = new Client({
    authStrategy: new LocalAuth(),
});


client.on("qr", (qr) => {
    console.log('qr is ', qr)
    qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
    console.log("AUTHENTICATED");
});

client.on("ready", () => {
    console.log("Client is ready!");
    console.log('Client is ready!');

    // const number = "+972545944849";
    // const text = "Hi Shakhafi :-) does it work?";
    // const chatId = number.substring(1) + "@c.us";
    // client.sendMessage(chatId, text);



    // client.isRegisteredUser("972546519551@c.us").
    //     then(function (isRegistered) {
    //         if (isRegistered) {
    //             client.sendMessage("972546519551@c.us", "hello from me !");

    //         }
    //     })
});


// client.isRegisteredUser("972546519551@c.us").
// then(function (isRegistered) {
//     if (isRegistered) {
//         client.sendMessage("972546519551@c.us", "hello from me !");
//     }
// })

client.on("message", async (message) => {
    console.log("got message !", Object.keys(message))
    console.log("got message", message.body)
    console.log("got from", message.from)
    if (message.body === "hello") {
        message.reply("Hiiiii");
    }
    if (message.hasMedia) {

        const media = await message.downloadMedia();
        console.log('media 2', media)
    }
})

client.initialize();


