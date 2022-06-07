import express, { Express, Request, Response } from 'express';
import axios from 'axios';

const app: Express = express();
const port = 8080;

app.get('/', (req: Request, res: Response) => {
  res.send('Server Running');
});

app.get('/data', (req: Request, res: Response) => {
  axios
    .get('http://localhost:8086/query', {
      params: {
        db: "telegraf",
        q: "SELECT \"temperature\"*9/5+32,\"humidity\" FROM \"pi-sensors\" GROUP BY \"url\" ORDER BY \"time\" DESC LIMIT 1"
      }
    })
    .then((response) => {
      const values = response.data.results[0].series
      const result = values.map((val: SeriesData) => {
        return {
          "server": val.tags.url,
          "temperature": val.values[0][1],
          "humidity": val.values[0][2]
        }
      })

      if(!result) {
        res.status(500)
        res.send("Error fetching data")
      } else {
        res.send(result);
      }      
    })
    .catch((error) => {
      res.status(500)
      res.send("Error fetching data")
    })
    .then();
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
