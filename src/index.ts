import express, { Express, Request, Response } from 'express'
import axios from 'axios'
import cors from 'cors'

const app: Express = express()
app.use(cors())
const port = 9001

app.get('/', (req: Request, res: Response) => {
  res.send('Server Running')
})

interface SensorMeasurement {
  time: string
  server: string
  temperature: number
  humidity: number
}

app.get('/data', (req: Request, res: Response) => {
  axios
    .get('http://piserver:8086/query', {
      params: {
        db: 'telegraf',
        q: 'SELECT MEAN("temperature")*9/5+32,MEAN("humidity") FROM "pi-sensors" WHERE "time" > now() - 2d GROUP BY "url",time(1h) FILL(0)',
      },
    })
    .then((response) => {
      const values = response.data.results[0].series
      const result: SensorMeasurement[] = values.flatMap((val: SeriesData) => {
        const re = /pi[0-9]+/
        const found = val.tags.url.match(re) ?? [val.tags.url]
        return val.values.flatMap((v) => {
          return {
            server: found[0],
            time: v[0],
            temperature: v[1],
            humidity: v[2],
          }
        })
      })

      if (!result) {
        res.status(500)
        res.send(response)
      } else {
        res.send(result)
      }
    })
    .catch((error) => {
      res.status(500)
      res.send(error)
    })
    .then()
})

app.get('/status', (req: Request, res: Response) => {
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

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`)
})
