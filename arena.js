require('dotenv').config();

const Arena = require('bull-arena');

const express = require('express');
const app = express();
const router = express.Router();

const { REDIS, QUEUE_NAME, ARENA_PORT } = process.env;

const arena = Arena({
    queues: [{
        name: QUEUE_NAME,
        hostId: "Queue Server 1",
        type: "bull",
        url: REDIS
    }]
});

router.use('/', arena);

app.use(router);

app.listen(ARENA_PORT, () => {
  console.log('running on http://localhost:5001', process.env.DB_HOST);
});