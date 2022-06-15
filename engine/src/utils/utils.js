import * as fs from "fs";
import * as path from "path";

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


const loadImagesFromFolder = async (folderPath) => {
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

export { timeStamp, loadImagesFromFolder, db }