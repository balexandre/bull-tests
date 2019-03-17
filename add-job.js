require("dotenv").config();

const Bull = require("bull");

const { REDIS, QUEUE_NAME } = process.env;
const queue = new Bull(QUEUE_NAME, REDIS);

// const jobCount = process.argv && process.argv.length > 1 ? parseInt(process.argv[2], 10) : 1;
// console.log('jobCount says:', jobCount);

const jobCount = 1;
const campaignId = process.argv && process.argv.length > 1 ? parseInt(process.argv[2], 10) : 1;
console.log('jobCount says:', campaignId);

// add campaign to queue so the fetch can be perform
for (let i = 0; i < jobCount; i += 1)
  queue
    .add(
      {
        campaign: campaignId + i,
        segment: 0
      },
      { priority: 2 }
    )
    .then(j => {
      console.log("JOB WAS ADDED", j);
      process.exit();
    })
    .catch(err => console.log("ERROR ADDING JOB: " + err.message));
