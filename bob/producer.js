const { Kafka, Partitioners } = require("kafkajs");

const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092", "localhost:9093", "localhost:9094"],
});

const producer = kafka.producer({
    allowAutoTopicCreation: true,
    createPartitioner: Partitioners.DefaultPartitioner,
});

const 밥다먹었다 = async () => {
    await producer.connect();

    await producer.send({
        topic: "bob_clear",
        messages: [
            { value: "닭갈비" },
            { value: "마라탕" },
            { value: "순대국" },
            { value: "김치찌개" },
        ],
    });

    await producer.disconnect();

    console.log("맛있다!");

    process.exit(0);
};

밥다먹었다();