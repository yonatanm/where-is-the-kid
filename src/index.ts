import express from 'express'
import 'dotenv/config'
import { simulate, getFaceGroups, getStatus } from './whatsapp/app'
import multer from 'multer'
import { log } from './utils/utils'

const version = process.env.VERSION || 'dev'

log.info(`we are on the air with version: ${version}`)

const server = express()
const port = process.env.PORT || process.env.APP_PORT

server.get('/api/version', async (req, res) => {
    res.send(version)
})

server.get('/api/status', async (req, res) => {
    res.json(await getStatus())
})

const upload = multer();

server.get('/api/wa/getFaceGroups', async (req, res) => {
    res.json(await getFaceGroups())
})
server.get('/api/wa/simulate', async (req, res) => {
    await simulate()
    res.json("OK 33")
})

server.listen(port, async () => {
    log.info('@@@ listeneing @@@@')

    console.log(`Example app listening on port ${port}`)
})