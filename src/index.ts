import express, { Express, Response } from 'express'
import axios from 'axios'
import cors from 'cors'
import { getData, Measurement } from './influx'

const app: Express = express()
app.use(cors())
const port = 9001

app.get('/', (_, res: Response) => {
  res.send('Server Running')
})

app.get('/status', (_, res: Response) => {
  const requests = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    .map((n) => 'pi' + n)
    .map((pi) => {
      return axios
        .get('http://' + pi + ':6725/devices', { timeout: 2000 })
        .then((response) => {
          return {
            server: pi,
            devices: {
              ...response.data,
            },
          }
        })
        .catch(() => {
          return {
            server: pi,
            devices: {},
          }
        })
    })
  Promise.all(requests).then((result) => {
    res.send(result)
  })
})

app.get('/data', (_, res: Response) => {
  getData([
    Measurement.AQ_pm03,
    Measurement.AQ_pm05,
    Measurement.AQ_pm10,
    Measurement.AQ_pm25,
    Measurement.AQ_pm50,
    Measurement.AQ_pm100,
    Measurement.Temperature,
    Measurement.Humidity,
  ]).then(
    (result) => {
      res.send(result)
    },
    (error) => {
      res.status(500)
      res.send(error)
    }
  )
})

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`)
})
