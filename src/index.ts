import express from 'express'
import 'dotenv/config'
import { addController } from './controllers/addController'
import { compareController } from './controllers/compareController'
import { searchController } from './controllers/searchController'
import { getChats } from './whatsapp/app'
import multer from 'multer'
import { log } from './utils/utils'

const version = process.env.VERSION || 'dev'

log.info(` we are on the air with version ${version}`)

const server = express()
const port = process.env.PORT || process.env.APP_PORT



server.get('/api/version', async (req, res) => {
    res.send(version)
})


const upload = multer();

server.post('/api/compare', upload.fields([{ name: 'gallary' }, { name: 'portraits' }]), async (req, res) => {
    const formData = req.body;

    console.log('form data: ', formData.k1);
    console.log('form files: ', req?.files);

    ((req?.files as any).portraits as any[]).forEach((f, i) => {
        const attachment = f.buffer as Buffer
        console.log('portrait ' + i, f)
    });

    res.sendStatus(200);
    await compareController.compare(req.files, formData)
});

server.get('/api/wa/getChats', async (req, res) => {
    await getChats((req.query?.id || '') as string)
    res.json("OK 33")
    // res.json(await getChats())
    // res.write(await getChats())
})

server.listen(port, async () => {
    log.info('@@@ listeneing @@@@')

    console.log(`Example app listening on port ${port}`)
})