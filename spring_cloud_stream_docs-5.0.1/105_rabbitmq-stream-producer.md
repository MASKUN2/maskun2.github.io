# Initial Producer Support for the RabbitMQ Stream Plugin

Basic support for the [RabbitMQ Stream Plugin](https://rabbitmq.com/stream.html) is now provided.
To enable this feature, you must add the `spring-rabbit-stream` jar to the class path - it must be the same version as `spring-amqp` and `spring-rabbit`.

|  |  |
| --- | --- |
|  | The producer properties described above are not supported when you set the `producerType` property to `STREAM_SYNC` or `STREAM_ASYNC`. |

To configure the binder to use a stream `ProducerType`, Spring Boot will configure an `Environment` `@Bean` from the application properties.
You can, optionally, add a customizer to customize the message handler.

```
@Bean
ProducerMessageHandlerCustomizer<MessageHandler> handlerCustomizer() {
    return (hand, dest) -> {
        RabbitStreamMessageHandler handler = (RabbitStreamMessageHandler) hand;
        handler.setConfirmTimeout(5000);
        ((RabbitStreamTemplate) handler.getStreamOperations()).setProducerCustomizer(
                (name, builder) -> {
                    ...
                });
    };
}
```

Refer to the [RabbitMQ Stream Java Client documentation](https://rabbitmq.github.io/rabbitmq-stream-java-client/stable/htmlsingle/) for information about configuring the environment and producer builder.

## Producer Support for the RabbitMQ Super Streams

See [Super Streams](https://blog.rabbitmq.com/posts/2022/07/rabbitmq-3-11-feature-preview-super-streams) for information about super streams.

Use of super streams allows for automatic scale-up scale-down with a single active consumer on each partition of a super stream.
Using Spring Cloud Stream, you can publish to a super stream either over AMQP, or using the stream client.

|  |  |
| --- | --- |
|  | The super stream must already exist; creating a super stream is not supported by producer bindings. |

Publishing to a super stream over AMQP:

```
spring.cloud.stream.bindings.output.destination=super
spring.cloud.stream.bindings.output.producer.partition-count=3
spring.cloud.stream.bindings.output.producer.partition-key-expression=headers['cust-no']
spring.cloud.stream.rabbit.bindings.output.producer.declare-exchange=false
```

Publishing to a super stream using the stream client:

```
spring.cloud.stream.bindings.output.destination=super
spring.cloud.stream.bindings.output.producer.partition-count=3
spring.cloud.stream.bindings.output.producer.partition-key-expression=headers['cust-no']
spring.cloud.stream.rabbit.bindings.output.producer.producer-type=stream-async
spring.cloud.stream.rabbit.bindings.output.producer.super-stream=true
spring.cloud.stream.rabbit.bindings.output.producer.declare-exchange=false
```

When using the stream client, if you set a `confirmAckChannel`, a copy of a successfully sent message will be sent to that channel.