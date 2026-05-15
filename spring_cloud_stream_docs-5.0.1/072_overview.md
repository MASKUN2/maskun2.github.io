# Overview

Spring Cloud Stream includes a binder implementation designed explicitly for [Apache Kafka Streams](https://kafka.apache.org/documentation/streams/) binding.
With this native integration, a Spring Cloud Stream "processor" application can directly use the
[Apache Kafka Streams](https://kafka.apache.org/documentation/streams/developer-guide) APIs in the core business logic.

Kafka Streams binder implementation builds on the foundations provided by the [Spring for Apache Kafka](https://docs.spring.io/spring-kafka/reference/html/#kafka-streams) project.

Kafka Streams binder provides binding capabilities for the three major types in Kafka Streams - `KStream`, `KTable` and `GlobalKTable`.

Kafka Streams applications typically follow a model in which the records are read from an inbound topic, apply business logic, and then write the transformed records to an outbound topic.
Alternatively, a Processor application with no outbound destination can be defined as well.

In the following sections, we are going to look at the details of Spring Cloud Stream’s integration with Kafka Streams.