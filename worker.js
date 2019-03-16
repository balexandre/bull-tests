require('dotenv').config();

const Bull = require('bull');

const { REDIS, QUEUE_NAME } = process.env;
const queue = new Bull(QUEUE_NAME, REDIS);
let total = 0;

const doSomething = job => {
    return new Promise((resolve, reject) => {
        total += 1;
        console.log('We did something: ', total);
        resolve();
    });
};

queue.process(async (job, done) => {
    console.log('job', JSON.stringify(job, null, 4));
    doSomething(job)
        .then(() => done())
        .catch(err => done(err));
});

queue.on('added', (job, data) => {
    console.log('JOB ADDED! ', total);
});
queue.on('completed', (job, data) => {
    console.log('JOB DONE! ', total);
});