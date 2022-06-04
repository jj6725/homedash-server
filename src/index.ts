import express, { Express, Request, Response } from 'express';
import axios from 'axios';

const app: Express = express();
const port = 8080;

app.get('/', (req: Request, res: Response) => {
  res.send('200OK');
});

app.get('/temperatures', (req: Request, res: Response) => {
  axios
    .get('http://192.168.1.248:6725/temp')
    .then((response) => {
      res.send(response.data);
    })
    .catch((error) => {
      res.send(error);
    })
    .then();
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
