const { Kafka, logLevel, Partitioners } = require("kafkajs");

const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092", "localhost:9093", "localhost:9094"],
    logLevel: logLevel.ERROR,
});

const topics = ["multi1", "multi2"];

const handleTopic = async () => {
    const admin = kafka.admin();
    await admin.connect();

    const topicList = await admin.listTopics();

    for (const topic of topics) {
        if (!topicList.includes(topic)) {
            await admin.createTopics({
                // 파티션이 1개면 컨슈머가 여러개여도 하나의 컨슈머만 메시지를 가져감. 즉, 파티션 수 > 컨슈머 수
                topics: [{ topic, numPartitions: 3 }],
            });
            console.log(`topic ${topic} created`);
        }
    }

    await admin.disconnect();
};

const main = async () => {
    await handleTopic();

    const consumer1 = kafka.consumer({
        groupId: "test-group1",
        rebalanceTimeout: 30000,
        sessionTimeout: 7000,
        retry: {
            retries: 2,
            restartOnFailure: async (error) => {
                console.log("restartOnFailure: ", error);
                return true;
            },
        },
    });

    // const consumer2 = kafka.consumer({
    //     groupId: "test-group1",
    //     rebalanceTimeout: 30000,
    //     sessionTimeout: 7000,
    //     retry: {
    //         retries: 2,
    //         restartOnFailure: async (error) => {
    //             console.log("restartOnFailure: ", error);
    //             return true;
    //         },
    //     },
    // });

    await consumer1.connect();
    // await consumer2.connect();

    await consumer1.subscribe({ topic: "multi1" });
    // await consumer2.subscribe({ topic: "multi2" });

    await consumer1.run({
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
            console.log(`consumer1: ${message.value.toString()}`);
            heartbeat();
        },
    });

    // await consumer2.run({
    //     eachMessage: async ({ topic, partition, message, heartbeat }) => {
    //         console.log(`consumer2: ${message.value.toString()}`);
    //         heartbeat();
    //     },
    // });
};

const main2 = async () => {
    await handleTopic();

    const consumer1 = kafka.consumer({
        groupId: "test-group2",
        rebalanceTimeout: 30000,
        sessionTimeout: 7000,
        retry: {
            retries: 2,
            restartOnFailure: async (error) => {
                console.log("restartOnFailure: ", error);
                return true;
            },
        },
    });

    await consumer1.connect();

    await consumer1.subscribe({ topic: "multi2" });

    await consumer1.run({
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
            console.log(`consumer2: ${message.value.toString()}`);
            heartbeat();
        },
    });
};

main();
main2();