import express, { response } from 'express'
import 'dotenv/config'
import { simulate, getFaceGroups, getStatus } from './whatsapp/app'

const version = process.env.VERSION || 'dev'

console.log(`we are on the air with version: ${version}`)

const server = express()
const port = process.env.PORT || process.env.APP_PORT

server.get('/api/version', async (req, res) => {
    res.send(version)
})

server.get('/api/status', async (req, res) => {
    res.json(await getStatus())
})

server.get('/api/connected', async (req, res, next) => {
    console.log(`/api/connected IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress } UA: ${req.headers['user-agent']}`)
    const status = await getStatus()
    if (status && status.connected) {
        res.sendStatus(200)
    } else {
        res.sendStatus(503)
    }
})


server.get('/api/wa/getFaceGroups', async (req, res) => {
    res.json(await getFaceGroups())
})
server.get('/api/wa/simulate', async (req: any, res) => {
    await simulate(req.query?.name || '')
    res.json("OK")
})

server.listen(port, async () => {
    console.log('--- listeneing ---')

    console.log(`Example app listening on port ${port}`)
})