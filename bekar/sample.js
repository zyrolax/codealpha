const express = require('express');
const http = require('http');

const app = express();
const port = 8080;

app.get('/', (req, res) => {
  res.send('Backend server is running online!');
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
