const { Kafka, logLevel, Partitioners } = require("kafkajs");

const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092", "localhost:9093", "localhost:9094"],
    logLevel: logLevel.ERROR,
});

const topics = ["test-topic", "DLT"];

const producer = kafka.producer({
    allowAutoTopicCreation: false,
    createPartitioner: Partitioners.DefaultPartitioner,
});

const consumer = kafka.consumer({
    groupId: "test-group",
    rebalanceTimeout: 30000,
    sessionTimeout: 7000,
    // heartbeatInterval: 3000,
    retry: {
        // initialRetryTime: 1000,
        retries: 2,
        restartOnFailure: async (error) => {
            // console.error(error);
            console.log("restartOnFailure: ", error);
            return true;
        },
    },
});

const main = async () => {
    await producer.connect();
    await consumer.connect();
    await consumer.subscribe({ topic: "DLT", fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
            const obj = JSON.parse(message.value.toString());

            setInterval(() => {
                heartbeat();
            }, 3000);

            const { originTopic, originPartition, originOffset, originValue } =
                obj;

            await producer.send({
                topic: originTopic,
                messages: [
                    {
                        value: originValue,
                        headers: {
                            originPartition: `${originPartition}`,
                            originOffset,
                            retry: "true",
                        },
                    },
                ],
            });
        },
    });
};

main();

const { HEARTBEAT } = consumer.events;
const removeListener = consumer.on(HEARTBEAT, (e) =>
    console.log(`heartbeat at ${e.timestamp}`)
);
