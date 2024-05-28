const { Kafka, Partitioners } = require("kafkajs");

const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092", "localhost:9093", "localhost:9094"],
});

const producer = kafka.producer({
    allowAutoTopicCreation: false,
    createPartitioner: Partitioners.DefaultPartitioner,
});

const main = async () => {
    await producer.connect();

    const arr = new Array(100).fill(0);

    // await producer.send({
    //     topic: "test-topic",
    //     messages: arr.map((_, index) => ({ value: `${index + 1}` })),
    // });
    // await producer.disconnect();

    let count = 0;
    setInterval(async () => {
        await producer.send({
            topic: "test-topic",
            messages: [
                {
                    value: `${count++}`,
                },
            ],
        });
    }, 500);
};

main();

const errorTypes = ["unhandledRejection", "uncaughtException"];
const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];

errorTypes.forEach((type) => {
    process.on(type, async (err) => {
        try {
            console.log(`process.on ${type}, ${err}`);
            await producer.disconnect();
            process.exit(0);
        } catch (_) {
            process.exit(1);
        }
    });
});

signalTraps.forEach((type) => {
    process.once(type, async () => {
        try {
            await producer.disconnect();
        } finally {
            process.kill(process.pid, type);
        }
    });
});
