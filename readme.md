# Testing NodeJs with Bull Queue

## Worker

```bash
node ./worker.js
```

## Add a job

```bash
node ./add-job.js
```

## Arena UI

```bash
node ./arena.js
```

and then go to http://localhost:5023

## Websockets

used an [old example for NodeJs Websockets](https://medium.com/@martin.sikora/node-js-websocket-simple-chat-tutorial-2def3a841b61) so we can see the progress of the Queue, as well add important jobs to queue (it will process that job as soon as it's completed the current one).