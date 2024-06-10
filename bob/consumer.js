const { Kafka, logLevel } = require("kafkajs");

const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092", "localhost:9093", "localhost:9094"],
    logLevel: logLevel.ERROR,
});

const 소화컨슈머 = kafka.consumer({
    groupId: "소화그룹",
});

const 디저트컨슈머 = kafka.consumer({
    groupId: "디저트그룹",
});

const 설거지컨슈머 = kafka.consumer({
    groupId: "설거지그룹",
});

const main = async () => {
    await 소화컨슈머.connect();
    await 디저트컨슈머.connect();
    await 설거지컨슈머.connect();

    await 소화컨슈머.subscribe({
        topics: ["bob_clear"],
        fromBeginning: true,
    });
    await 디저트컨슈머.subscribe({
        topics: ["bob_clear"],
        fromBeginning: true,
    });
    await 설거지컨슈머.subscribe({
        topics: ["bob_clear"],
        fromBeginning: true,
    });

    await 소화컨슈머.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log("소화컨슈머", message.value.toString());
        },
    });

    await 디저트컨슈머.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log("디저트컨슈머", message.value.toString());
        },
    });

    await 설거지컨슈머.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log("설거지컨슈머", message.value.toString());
        },
    });
};

main();
