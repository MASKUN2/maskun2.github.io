# RabbitMQ Binder Reference Guide

This guide describes the RabbitMQ implementation of the Spring Cloud Stream Binder.
It contains information about its design, usage and configuration options, as well as information on how the Stream Cloud Stream concepts map into RabbitMQ specific constructs.

## Usage

To use the RabbitMQ binder, you can add it to your Spring Cloud Stream application, by using the following Maven coordinates:

```
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-stream-binder-rabbit</artifactId>
</dependency>
```

Alternatively, you can use the Spring Cloud Stream RabbitMQ Starter, as follows:

```
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-stream-rabbit</artifactId>
</dependency>
```

## RabbitMQ Binder Overview

The following simplified diagram shows how the RabbitMQ binder operates:

By default, the RabbitMQ Binder implementation maps each destination to a `TopicExchange`.
For each consumer group, a `Queue` is bound to that `TopicExchange`.
Each consumer instance has a corresponding RabbitMQ `Consumer` instance for its group’s `Queue`.
For partitioned producers and consumers, the queues are suffixed with the partition index and use the partition index as the routing key.
For anonymous consumers (those with no `group` property), an auto-delete queue (with a randomized unique name) is used.

By using the optional `autoBindDlq` option, you can configure the binder to create and configure dead-letter queues (DLQs) (and a dead-letter exchange `DLX`, as well as routing infrastructure).
By default, the dead letter queue has the name of the destination, appended with `.dlq`.
If retry is enabled (`maxAttempts > 1`), failed messages are delivered to the DLQ after retries are exhausted.
If retry is disabled (`maxAttempts = 1`), you should set `requeueRejected` to `false` (the default) so that failed messages are routed to the DLQ, instead of being re-queued.
In addition, `republishToDlq` causes the binder to publish a failed message to the DLQ (instead of rejecting it).
This feature lets additional information (such as the stack trace in the `x-exception-stacktrace` header) be added to the message in headers.
See the [`frameMaxHeadroom` property](rabbit_overview/rabbitmq-consumer-properties.html#spring-cloud-stream-rabbit-frame-max-headroom) for information about truncated stack traces.
This option does not need retry enabled.
You can republish a failed message after just one attempt.
Starting with version 1.2, you can configure the delivery mode of republished messages.
See the [`republishDeliveryMode` property](rabbit_overview/rabbitmq-consumer-properties.html#spring-cloud-stream-rabbit-republish-delivery-mode).

If the stream listener throws an `ImmediateAcknowledgeAmqpException`, the DLQ is bypassed and the message simply discarded.
Starting with version 2.1, this is true regardless of the setting of `republishToDlq`; previously it was only the case when `republishToDlq` was `false`.

|  |  |
| --- | --- |
|  | Setting `requeueRejected` to `true` (with `republishToDlq=false` ) causes the message to be re-queued and redelivered continually, which is likely not what you want unless the reason for the failure is transient. In general, you should enable retry within the binder by setting `maxAttempts` to greater than one or by setting `republishToDlq` to `true`. |

Starting with version 3.1.2, if the consumer is marked as `transacted`, publishing to the DLQ will participate in the transaction.
This allows the transaction to roll back if the publishing fails for some reason (for example, if the user is not authorized to publish to the dead letter exchange).
In addition, if the connection factory is configured for publisher confirms or returns, the publication to the DLQ will wait for the confirmation and check for a returned message.
If a negative acknowledgment or returned message is received, the binder will throw an `AmqpRejectAndDontRequeueException`, allowing the broker to take care of publishing to the DLQ as if the `republishToDlq` property is `false`.

See [RabbitMQ Binder Properties](rabbit_overview/binder-properties.html) for more information about these properties.

The framework does not provide any standard mechanism to consume dead-letter messages (or to re-route them back to the primary queue).
Some options are described in [Dead-Letter Queue Processing](rabbit_dlq.html).

|  |  |
| --- | --- |
|  | When multiple RabbitMQ binders are used in a Spring Cloud Stream application, it is important to disable 'RabbitAutoConfiguration' to avoid the same configuration from `RabbitAutoConfiguration` being applied to the two binders. You can exclude the class by using the `@SpringBootApplication` annotation. |

Starting with version 2.0, the `RabbitMessageChannelBinder` sets the `RabbitTemplate.userPublisherConnection` property to `true` so that the non-transactional producers avoid deadlocks on consumers, which can happen if cached connections are blocked because of a [memory alarm](https://www.rabbitmq.com/memory.html) on the broker.

|  |  |
| --- | --- |
|  | Currently, a `multiplex` consumer (a single consumer listening to multiple queues) is only supported for message-driven consumers; polled consumers can only retrieve messages from a single queue. |

## Configuration Options

This section contains settings specific to the RabbitMQ Binder and bound channels.

For general binding configuration options and properties, see the [Spring Cloud Stream core documentation](https://cloud.spring.io/spring-cloud-static/spring-cloud-stream/current/reference/html/spring-cloud-stream.html#_configuration_options).

## Section Summary

* Configuration Options
* [Using Existing Queues/Exchanges](rabbit_overview/existing-destinations.html)
* [Retry With the RabbitMQ Binder](rabbit_overview/rabbitmq-retry.html)
* [Error Channels](rabbit_overview/error-channels.html)
* [Partitioning with the RabbitMQ Binder](rabbit_partitions.html)
* [Rabbit Binder Health Indicator](rabbit_overview/health-indicator.html)