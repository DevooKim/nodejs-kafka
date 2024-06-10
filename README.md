# 여러 상황의 kafka를 다뤄보자

1. 기본적인 producer, consumer
2. 무한 rebalancing 이슈
3. consumer의 동기처리
4. 에러핸들링 retry(kafka에서 발생하는 에러)
5. DLT(Dead Letter Topic)
6. consumer_group 알아보기

# 정리

-   메세지 처리 시간이 sessionTimeout을 넘어가면 리밸런싱이 발생
    1. heartbeat를 주기적으로 호출
    2. 메세지 처리 시간을 줄임 (동기 등등)
-   동기적으로 처리하면 성능에 부담이 될 것 같다.
-   토픽의 파티션은 consumer보다 많아야 한다. 그렇지 않으면 노는 consumer가 발생한다.
-   partitionsConsumedConcurrently는 `동시 처리 수 + 컨슈머 수 < 파티션 수`가 되도록 한다.
-   consumer.disconnect()가 호출되면 sessionTimeout를 기다리지 않고 즉시(거의 바로) 리밸런싱이 발생한다.
    -   리밸런싱이 진행되는 동안 메세지는 소비되지 않는다.
-   동일한 consumer group id를 사용하는 consumer는 동시에 동일한 메세지를 소비한다.
