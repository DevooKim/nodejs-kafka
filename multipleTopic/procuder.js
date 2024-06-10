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

    await producer.send({
        topic: "multi1",
        messages: arr.map((_, index) => ({ value: `M1 - ${index + 1}` })),
    });

    await producer.send({
        topic: "multi2",
        messages: arr.map((_, index) => ({ value: `M2 - ${index + 1}` })),
    });
};

main();