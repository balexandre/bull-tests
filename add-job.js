require('dotenv').config();

const Bull = require('bull');

const { REDIS, QUEUE_NAME } = process.env;
const queue = new Bull(QUEUE_NAME, REDIS);

// add campaign to queue so the fetch can be perform
const task = {
    campaign: 170,
    segment: 0,
  };
  queue
      .add(task, { priority: 2 })
      .then(j => {
          console.log('JOB WAS ADDED', j);
          process.exit();
      })
      .catch(err => console.log('ERROR ADDING JOB: ' + err.message));
  