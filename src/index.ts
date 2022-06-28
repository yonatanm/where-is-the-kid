import express from 'express'
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

server.get('/api/wa/getFaceGroups', async (req, res) => {
    res.json(await getFaceGroups())
})
server.get('/api/wa/simulate', async (req : any, res) => {
    await simulate(req.query?.name||'')
    res.json("OK")
})

server.listen(port, async () => {
    console.log('--- listeneing ---')

    console.log(`Example app listening on port ${port}`)
})