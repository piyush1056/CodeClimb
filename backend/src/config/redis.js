const { createClient } = require("redis");

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
       socket: {
        host: 'redis-14430.crce300.ap-south-1-2.ec2.cloud.redislabs.com',
        port: 14430
    }
});


module.exports=redisClient;