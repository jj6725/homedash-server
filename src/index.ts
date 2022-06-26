import express, { Express, Request, Response } from 'express';
import axios from 'axios';

const app: Express = express();
const port = 9001;

app.get('/', (req: Request, res: Response) => {
  res.send('Server Running');
});

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
        db: "telegraf",
        q: "SELECT MEAN(\"temperature\")*9/5+32,MEAN(\"humidity\") FROM \"pi-sensors\" WHERE \"time\" > now() - 1d GROUP BY \"url\",time(1h)"
      }
    })
    .then((response) => {
      const values = response.data.results[0].series
      const result: SensorMeasurement[] = values.flatMap((val: SeriesData) => {
        const re = /pi[0-9]+/
        const found = val.tags.url.match(re) ?? [val.tags.url]
        return val.values.flatMap(v => {
            return {
              server: found[0],
              time: v[0],
              temperature: v[1],
              humidity: v[2]
            }
          })
      })

      // const newRes = result.reduce((group: TimeGroup, measurement) => {
      //   const { time } = measurement;
      //   group[time] = group[time] ?? [];
      //   group[time].push(measurement);
      //   return group;
      // }, {});
      

      if(!result) {
        res.status(500)
        res.send(response)
      } else {
        res.send(result);
      }      
    })
    .catch((error) => {
      res.status(500)
      res.send(error)
    })
    .then();
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
