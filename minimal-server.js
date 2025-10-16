const express = require('express');
const app = express();

app.get('/ping', (req, res) => {
  console.log('PING received!');
  res.send('PONG');
});

app.listen(5000, () => {
  console.log('Minimal server running on http://localhost:5000');
});
