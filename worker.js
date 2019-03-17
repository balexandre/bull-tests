require("dotenv").config();

const Bull = require("bull");
const Redis = require("ioredis");
const WebSocketServer = require("websocket").server;
const http = require("http");

const { REDIS, QUEUE_NAME } = process.env;

let total = 0;
var client = new Redis(REDIS);
var subscriber = new Redis(REDIS);

// WEBSOCKET
const ws = require("./websocket");

// QUEUE
var opts = {
  createClient: type => {
    switch (type) {
      case "client":
        return client;
      case "subscriber":
        return subscriber;
      default:
        return new Redis(REDIS);
    }
  }
};

const queue = new Bull(QUEUE_NAME, opts);

const doSomething = job => {
  return new Promise((resolve, reject) => {
    total += 1;
    setTimeout(() => {
      console.log("We did something: ", total);
      broadcastMessage("message", "We did something: ", total);
      job.progress(33);

      setTimeout(() => {
        job.progress(66);
        // reject(new Error('not good!'));
        // return;

        setTimeout(() => {
          job.progress(99);
          resolve();
          return;
        }, 1000);
      }, 1000);
    }, 1000);
  });
};

queue.process(async (job, done) => {
  //console.log('job', JSON.stringify(job, null, 4));
  return doSomething(job)
    .then(() => done(null, job.data.campaign))
    .catch(err => done(err));
});

console.log("Ready to accept jobs");

const broadcastMessage = (type, ...args) => {
  console.log("broadcasting message...");
  const json = JSON.stringify({
    type: "message",
    data: {
      author: "worker",
      text: type.toUpperCase() + " " + (args ? " --> " + args.join(" | ") : ""),
      color: "purple",
      time: Date.now()
    }
  });
  for (let i = 0; i < ws.clients.length; i++) {
    ws.clients[i].sendUTF(json);
  }
};

// ##############################################################
// events
// https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#events
queue.on("added", jobId => {
  // An error occured.
  console.log("JOB added! ", jobId);
  broadcastMessage("added! ", jobId);
});

queue.on("error", jobId => {
  // An error occured.
  console.log("JOB error! ", jobId, total);
  broadcastMessage("error! ", jobId, total);
});

queue.on("waiting", jobId => {
  // A Job is waiting to be processed as soon as a worker is idling.
  console.log("JOB waiting", jobId, total);
  broadcastMessage("waiting", jobId, total);
});

queue.on("active", (job, jobPromise) => {
  // A job has started. You can use `jobPromise.cancel()`` to abort it.
  console.log("JOB active", total);
  broadcastMessage(
    "active",
    job.data.campaign + " (" + job.opts.priority + ")",
    total
  );
  console.log(JSON.stringify(job));
});

queue.on("stalled", job => {
  // A job has been marked as stalled. This is useful for debugging job
  console.log("JOB stalled", total);
  broadcastMessage("stalled", total);
  // workers that crash or pause the event loop.
});

queue.on("progress", (job, progress) => {
  // A job's progress was updated!
  console.log("JOB progress", total, progress + "%");
  broadcastMessage(
    "progress",
    job.data.campaign + " (" + job.opts.priority + ")",
    total,
    progress + "%"
  );
});

queue.on("completed", (job, result) => {
  // A job successfully completed with a `result`.
  console.log("JOB completed", total, result);
  broadcastMessage(
    "completed",
    job.data.campaign + " (" + job.opts.priority + ")",
    total,
    result
  );
});

queue.on("failed", (job, error) => {
  // A job failed with reason `error`!
  console.log("JOB failed", total, error);
  broadcastMessage("failed", job.data.campaign, total, error);
});

queue.on("paused", () => {
  // The queue has been paused.
  console.log("JOB paused", total);
  broadcastMessage("paused", total);
});

queue.on("resumed", job => {
  // The queue has been resumed.
  console.log("JOB resumed", job.data.campaign, total);
  broadcastMessage("resumed", job.data.campaign, total);
});

queue.on("cleaned", (jobs, type) => {
  // Old jobs have been cleaned from the queue. `jobs` is an array of cleaned
  console.log("JOB cleaned", total, type);
  broadcastMessage("cleaned", total, type);
  // jobs, and `type` is the type of jobs cleaned.
});

queue.on("drained", () => {
  // Emitted every time the queue has processed all the waiting jobs (even if there can be some delayed jobs not yet processed)
  console.log("JOB drained");
  broadcastMessage("drained");
});

queue.on("removed", job => {
  // A job successfully removed.
  console.log("JOB removed", job.data.campaign, total);
  broadcastMessage("removed", job.data.campaign, total);
});

exports.queue = queue;
