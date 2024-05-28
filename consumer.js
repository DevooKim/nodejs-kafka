const { Kafka, logLevel, Partitioners } = require("kafkajs");

const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092", "localhost:9093", "localhost:9094"],
    logLevel: logLevel.ERROR,
});

const topics = ["test-topic"];

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
    await handleTopic();

    await consumer.connect();
    await consumer.subscribe({ topics });

    // await _default();
    // await rebalcingError();
    // await 동기처리();
    // await 에러핸들링();
    await DLT();
};

main();

async function _default() {
    await consumer.run({
        partitionsConsumedConcurrently: 2, // 동시처리 수 + 컨슈머 수 < 파티션 수
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
            // setInterval(() => {
            //     heartbeat();
            // }, 1000);

            console.log({
                value: message.value.toString(),
                offset: message.offset,
            });
            await new Promise((resolve) => setTimeout(resolve, 2000));
        },
    });
}

async function rebalcingError() {
    await consumer.run({
        partitionsConsumedConcurrently: 1,
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
            console.log({
                value: message.value.toString(),
                offset: message.offset,
            });
            // 메세지 처리 시간이 sessionTimeout을 넘어가면 리밸런싱이 발생
            // 해결책1. heartbeat를 주기적으로 호출
            // 해결책2. 메세지 처리 시간을 줄임 (동기 등등)
            await new Promise((resolve) => setTimeout(resolve, 10000));
        },
    });
}

// 성능에 부담될 듯
async function 동기처리() {
    await consumer.run({
        partitionsConsumedConcurrently: 1,
        eachMessage: ({ topic, partition, message, heartbeat }) => {
            console.log("received message: ", message.offset);
            new Promise((resolve) => {
                setTimeout(() => {
                    console.log({
                        value: message.value.toString(),
                        offset: message.offset,
                    });
                    resolve();
                }, 15000);
            });
        },
    });
}

async function 에러핸들링() {
    await consumer.run({
        partitionsConsumedConcurrently: 1,
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
            console.log({
                value: message.value.toString(),
                offset: message.offset,
            });
            try {
                throw new Error("에러핸들링");
            } catch (e) {
                throw e;
            }
        },
    });
}

async function DLT() {
    const producer = kafka.producer({
        createPartitioner: Partitioners.DefaultPartitioner,
    });
    await producer.connect();

    await consumer.run({
        partitionsConsumedConcurrently: 1,
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
            console.log({
                value: message.value.toString(),
                offset: message.offset,
            });
            try {
                throw new Error("에러핸들링");
            } catch (e) {
                console.log("DLT: ", message.value.toString());

                await producer.send({
                    topic: "DLT",
                    messages: [
                        {
                            value: JSON.stringify({
                                originTopic: topic,
                                originPartition: partition,
                                originOffset: message.offset,
                                originValue: message.value.toString(),
                                error: e.message,
                            }),
                        },
                    ],
                });
            }
        },
    });
}

const { HEARTBEAT } = consumer.events;
const removeListener = consumer.on(HEARTBEAT, (e) =>
    console.log(`heartbeat at ${e.timestamp}`)
);

const errorTypes = ["unhandledRejection", "uncaughtException"];
const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];

errorTypes.forEach((type) => {
    process.on(type, async (e) => {
        try {
            console.log(`process.on ${type}`);
            console.error(e);

            removeListener();
            await consumer.disconnect();
            process.exit(0);
        } catch (_) {
            process.exit(1);
        }
    });
});

signalTraps.forEach((type) => {
    process.once(type, async () => {
        try {
            console.log("bye");

            removeListener();
            await consumer.disconnect();
        } finally {
            process.kill(process.pid, type);
        }
    });
});
