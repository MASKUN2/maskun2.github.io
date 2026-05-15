# Spring Cloud Stream Reference Documentation

## Preface

This section goes into more detail about how you can work with Spring Cloud Stream.
It covers topics such as creating and running stream applications.

## Introducing Spring Cloud Stream

Spring Cloud Stream is a framework for building message-driven microservice applications.
Spring Cloud Stream builds upon Spring Boot to create standalone, production-grade Spring applications and uses Spring Integration to provide connectivity to message brokers.
It provides opinionated configuration of middleware from several vendors, introducing the concepts of persistent publish-subscribe semantics, consumer groups, and partitions.

By adding `spring-cloud-stream` dependencies to the classpath of your application, you get immediate connectivity
to a message broker exposed by the provided `spring-cloud-stream` binder (more on that later), and you can implement your functional
requirement, which is run (based on the incoming message) by a `java.util.function.Function`.

The following listing shows a quick example:

```
@SpringBootApplication
public class SampleApplication {

	public static void main(String[] args) {
		SpringApplication.run(SampleApplication.class, args);
	}

    @Bean
	public Function<String, String> uppercase() {
	    return value -> value.toUpperCase();
	}
}
```

The following listing shows the corresponding test:

```
@SpringBootTest(classes =  SampleApplication.class)
@EnableTestBinder
class BootTestStreamApplicationTests {

	@Autowired
	private InputDestination input;

	@Autowired
	private OutputDestination output;

	@Test
	void contextLoads() {
		input.send(new GenericMessage<byte[]>("hello".getBytes()));
		assertThat(output.receive().getPayload()).isEqualTo("HELLO".getBytes());
	}
}
```

## Main Concepts

Spring Cloud Stream provides a number of abstractions and primitives that simplify the writing of message-driven microservice applications.
The rest of this reference manual provides additional details.

## Section Summary

* Main Concepts and Abstractions
* [Programming Model](spring-cloud-stream/programming-model.html)
* [Binder abstraction](spring-cloud-stream/binders.html)
* [Error Handling](spring-cloud-stream/overview-error-handling.html)
* [Observability](observability.html)
* [Configuration Options](spring-cloud-stream/configuration-options.html)
* [Content Type Negotiation](spring-cloud-stream/content-type.html)
* [Inter-Application Communication](spring-cloud-stream/application-communication.html)
* [Partitioning](spring-cloud-stream/overview-partitioning.html)
* [Testing](spring-cloud-stream/spring_integration_test_binder.html)
* [Health Indicator](spring-cloud-stream/health-indicator.html)
* [Samples](spring-cloud-stream/samples.html)