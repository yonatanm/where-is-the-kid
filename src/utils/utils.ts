import * as fs from "fs";
import * as path from "path";
import 'dotenv/config'

const logDirectory =  process.env.LOG_DIR || '/tmp'

if (!fs.existsSync(logDirectory)){
    fs.mkdirSync(logDirectory, { recursive: true });
}

// const SimpleLogger = require("simple-node-logger")
import * as SimpleLogger from 'simple-node-logger'


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

log.setLevel('info');
console.log = (...args) => { log.info(...args) }
console.error = (...args) => { log.error(...args) }
console.warn = (...args) => { log.warn(...args) }


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

export { log, timeStamp, loadImagesFromFolder, db }