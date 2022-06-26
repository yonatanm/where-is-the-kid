import * as fs from "fs";
import * as path from "path";
import 'dotenv/config'
import fetch from 'node-fetch'
import { createNamespace } from 'cls-hooked';
import { v4 as uuidv4 } from 'uuid';
import * as SimpleLogger from 'simple-node-logger'

const applicationNamespace = createNamespace('APP_NAMESPACE');

const runWithContext = (cb: any, ...args: any) => {
    applicationNamespace.run(() => {
        applicationNamespace.set('REQUEST_ID', uuidv4());
        cb(...args)
    });
}



const logDirectory = process.env.LOG_DIR || '/tmp'

if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}



const opts = {
    errorEventName: 'error',
    logDirectory: logDirectory,
    fileNamePattern: 'roll-<DATE>.log',
    dateFormat: 'YYYY-MM-DD',
    timestampFormat: 'YYYY-MM-DD HH:mm:ss',
}
const x = {
    timestampFormat: 'YYYY-MM-DD HH:mm:ss',
}

const manager = SimpleLogger.createLogManager(x);
manager.createRollingFileAppender(opts);
const log = manager.createLogger();

const getRequestID = () => applicationNamespace.get('REQUEST_ID') || 'global'

log.setLevel('info');
console.log = (...args) => {
    log.info('[' + getRequestID() + ']', ...args)
}
console.warn = (...args) => {
    log.warn('[' + getRequestID() + ']', ...args)
}
console.error = (...args) => {
    log.error('[' + getRequestID() + ']', ...args)
}


const timeStamp = () => {
    const d = new Date();

    let year = d.getFullYear();
    let month = d.getMonth();
    let day = d.getDate();
    let hour = d.getHours();
    let minute = d.getMinutes();
    let seconds = d.getSeconds();
    return `${year}-${month}-${day}-${hour}-${minute}-${seconds}`
}


const loadImagesFromFolder = async (folderPath: string) => {
    console.log("loading images from " + folderPath)
    const files = await fs.promises.readdir(folderPath)
    const images = []
    for (let f of files) {
        images.push({ data: await fs.promises.readFile(path.resolve(folderPath, f)), metadata: { origFile: f } })
    }
    return images
}

const db = {
    users: {
        yonatan: { id: '15', name: 'ym' }
    },
    persons: {
        goni: { id: '3', name: 'goni' },
        inbar: { id: '4', name: 'inabr' },
    }
}

const imageUrlToBase64 = async (url: string) => {
    let response = await fetch(url);
    const blob = await response.arrayBuffer();
    // return  `data:${response.headers.get('content-type') || 'image/jpeg'};base64,${Buffer.from(blob).toString("base64")}`
    return Buffer.from(blob).toString("base64")

}

export { runWithContext, log, timeStamp, loadImagesFromFolder, db, imageUrlToBase64 }