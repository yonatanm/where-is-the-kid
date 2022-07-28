import express, { response } from 'express'
import 'dotenv/config'
import { simulate, getStatus } from './whatsapp/app'
const path = require('path')

const version = process.env.VERSION || 'dev'

console.log(`we are on the air with version: ${version}`)

const server = express()
const port = process.env.PORT || process.env.APP_PORT

const asset = path.join(__dirname, '..', 'assets')
server.use('/about', express.static(asset+'/about'));

server.get('/api/version', async (req, res) => {
    res.send(version)
})

server.get('/api/status', async (req, res) => {
    res.json(await getStatus())
})

server.get('/api/connected', async (req, res, next) => {
    const status = await getStatus()
    const connected = status?.connected
    if (connected) {
        res.sendStatus(200)
    } else {
        res.sendStatus(503)
    }
    console.log(`connected check: ${connected} from IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress} UA: ${req.headers['user-agent']}`)
})

server.get('/api/wa/simulate', async (req: any, res) => {
    await simulate(req.query?.name || '')
    res.json("OK")
})

server.listen(port, async () => {
    console.log('--- listeneing ---')

    console.log(`Example app listening on port ${port}  ${__dirname}`)
})