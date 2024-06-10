const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092", "localhost:9093", "localhost:9094"],
});

const main = async () => {
    const consumer1 = kafka.consumer({
        groupId: "group1",
        sessionTimeout: 10000,
    });

    const consumer2 = kafka.consumer({
        groupId: "group2",
        sessionTimeout: 10000,
    });

    await consumer1.connect();
    await consumer2.connect();

    await consumer1.subscribe({
        topics: ["test-topic"],
        fromBeginning: false,
    });
    await consumer2.subscribe({
        topics: ["test-topic"],
        fromBeginning: false,
    });

    await consumer1.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(
                "consumer1",
                message.value.toString(),
                partition,
                topic
            );
        },
    });

    await consumer2.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(
                "consumer2",
                message.value.toString(),
                partition,
                topic
            );
        },
    });
};

main();
