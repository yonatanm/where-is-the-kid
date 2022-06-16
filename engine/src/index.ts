import express from 'express'
import 'dotenv/config'
import { addController } from './controllers/addController'
import { compareController } from './controllers/compareController'
import { searchController } from './controllers/searchController'
const server = express()
const port = process.env.APP_PORT


server.get('/api/add', async (req, res) => {
    await addController.add()
})
server.get('/api/search', async (req, res) => {
    await searchController.search()
})
server.get('/api/compare', async (req, res) => {
    await compareController.compare()
})


server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})