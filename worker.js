require('dotenv').config();

const Bull = require('bull');

const { REDIS, QUEUE_NAME } = process.env;
const queue = new Bull(QUEUE_NAME, REDIS);

const doSomething = data => {
    return new Promise((resolve, reject) => {
        console.log('We did something (o:~')
        resolve(data);
    });
};

queue.process(async (job, data) => {
    console.log('job', JSON.stringify(job, null, 4));
    console.log('data', JSON.stringify(data, null, 4));
    return doSomething(data);
});

queue.on('added', (job, data) => {
    console.log('JOB ADDED!');
});
queue.on('completed', (job, data) => {
    console.log('JOB DONE!');
});