# Overview

The following image shows a simplified diagram of how the Apache Kafka binder operates:

The Apache Kafka Binder implementation maps each destination to an Apache Kafka topic.
The consumer group maps directly to the same Apache Kafka concept.
Partitioning also maps directly to Apache Kafka partitions as well.

The binder currently uses the Apache Kafka `kafka-clients` version `3.1.0`.
This client can communicate with older brokers (see the Kafka documentation), but certain features may not be available.
For example, with versions earlier than 0.11.x.x, native headers are not supported.
Also, 0.11.x.x does not support the `autoAddPartitions` property.