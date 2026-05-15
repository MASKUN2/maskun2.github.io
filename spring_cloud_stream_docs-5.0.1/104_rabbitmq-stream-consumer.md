# Initial Consumer Support for the RabbitMQ Stream Plugin

Basic support for the [RabbitMQ Stream Plugin](https://rabbitmq.com/stream.html) is now provided.
To enable this feature, you must add the `spring-rabbit-stream` jar to the class path - it must be the same version as `spring-amqp` and `spring-rabbit`.

|  |  |
| --- | --- |
|  | The consumer properties described above are not supported when you set the `containerType` property to `stream`; `concurrency` is supported for super streams only. Only a single stream queue can be consumed by each binding. |

To configure the binder to use `containerType=stream`, Spring Boot will automatically configure an `Environment` `@Bean` from the application properties.
You can, optionally, add a customizer to customize the listener container.

```
@Bean
ListenerContainerCustomizer<MessageListenerContainer> customizer() {
    return (cont, dest, group) -> {
        StreamListenerContainer container = (StreamListenerContainer) cont;
        container.setConsumerCustomizer((name, builder) -> {
            builder.offset(OffsetSpecification.first());
        });
        // ...
    };
}
```

The `name` argument passed to the customizer is `destination + '.' + group + '.container'`.

The stream `name()` (for the purpose of offset tracking) is set to the binding `destination + '.' + group`.
It can be changed using a `ConsumerCustomizer` shown above.
If you decide to use manual offset tracking, the `Context` is available as a message header:

```
int count;

@Bean
public Consumer<Message<?>> input() {
    return msg -> {
        System.out.println(msg);
        if (++count % 1000 == 0) {
            Context context = msg.getHeaders().get("rabbitmq_streamContext", Context.class);
            context.consumer().store(context.offset());
        }
    };
}
```

Refer to the [RabbitMQ Stream Java Client documentation](https://rabbitmq.github.io/rabbitmq-stream-java-client/stable/htmlsingle/) for information about configuring the environment and consumer builder.

## Consumer Support for the RabbitMQ Super Streams

See [Super Streams](https://blog.rabbitmq.com/posts/2022/07/rabbitmq-3-11-feature-preview-super-streams) for information about super streams.

Use of super streams allows for automatic scale-up scale-down with a single active consumer on each partition of a super stream.

Configuration example:

```
@Bean
public Consumer<Thing> input() {
    ...
}
```

```
spring.cloud.stream.bindings.input-in-0.destination=super
spring.cloud.stream.bindings.input-in-0.group=test
spring.cloud.stream.bindings.input-in-0.consumer.instance-count=3
spring.cloud.stream.bindings.input-in-0.consumer.concurrency=3
spring.cloud.stream.rabbit.bindings.input-in-0.consumer.container-type=STREAM
spring.cloud.stream.rabbit.bindings.input-in-0.consumer.super-stream=true
```

The framework will create a super stream named `super`, with 9 partitions.
Up to 3 instances of this application can be deployed.