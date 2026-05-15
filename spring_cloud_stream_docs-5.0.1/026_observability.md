# Observability

Spring provides support for Observability via [Micrometer](https://micrometer.io/) which defines an [Observation concept that enables both Metrics and Traces](https://micrometer.io/docs/observation) in applications.

Spring cloud Stream integrates such support at the level of [Spring Cloud Function](https://spring.io/projects/spring-cloud-function) by providing amongst several abstractions an `ObservationFunctionAroundWrapper`, which wraps function to handle observations out of the box.

**Required dependencies**

```
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
	<groupId>io.projectreactor</groupId>
	<artifactId>reactor-core-micrometer</artifactId>
</dependency>
```

and one of the available tracer bridges. For example [Zipkin Brave](https://zipkin.io/)

```
<dependency>
	<groupId>io.micrometer</groupId>
	<artifactId>micrometer-tracing-bridge-brave</artifactId>
</dependency>
```

## Imperative Functions

Imperative functions are wrapped with the observation wrapper `ObservationFunctionAroundWrapper` which provides necessary infrastructure to handle the interaction with the Observation registry.
Such interactions happen per each invocation of the function which effectively means that observation is attached to each invocation of the
function (i.e., single observation per message).
In other words for imperative functions if the required dependencies mentioned earlier are present, observability will just work.

## Reactive Functions

Reactive functions are inherently different then imperative functions and as such are not wrapped with `ObservationFunctionAroundWrapper`.

*Imperative function* is a message handler function and invoked by the framework each time there is a message, sort of your typical event handler where for N messages there will be N invocations of such function. That allows us to wrap such function to decorate it with additional functionality such as *error handling*, *retries*, and of course *observability*.

*Reactive function* is initialization function. Its job is to connect user provided stream processing code (Flux) with source and target stream provided by the binder. It is invoked only once during the startup of the application. Once stream code is connected with source/target stream we have no visibility nor control of the actual stream processing. It’s in the hands of reactive API. Reactive function also brings an additional variable. Given the fact that the function gives you a visibility to the entire stream chain (not just a single event), what should be the default unit of observation?
A single item in the stream chain? A range of items? What if there are no messages after some time elapsed? etc. . . What we wanted is to emphasise that with reactive functions we can’t assume anything. (For more information about the differences between reactive and imperative functions please see [Reactive Functions](spring-cloud-stream/producing-and-consuming-messages.html#reactive-functions-support)).

So, just like with *retries* and *error handling* you need to handle observation manually.

Thankfully you can do it easily by tapping into a segment of your stream using the `tap` operation of reactive API while providing an instance of `ObservationRegistry`. Such segment defines a unit of observation, which could be a single item in the flux or a range or whatever else you may want to observe within the stream.

```
@SpringBootApplication
public class DemoStreamApplication {

	Logger logger = LoggerFactory.getLogger(DemoStreamApplication.class);

	public static void main(String[] args) {
		Hooks.enableAutomaticContextPropagation();
		SpringApplication.run(DemoStreamApplication.class, args);
	}

	@Bean
	public Function<Flux<String>, Flux<String>> uppercase(ObservationRegistry registry) {
		return flux -> flux.flatMap(item -> {
			return Mono.just(item)
                             .map(value -> value.toUpperCase())
                             .doOnNext(v -> logger.info(v))
                             .tap(Micrometer.observation(registry));
		});
	}
}
```

The above example emulates attaching an [Observation](https://projectreactor.io/docs/core/release/reference/#_observation) to a single message processing (i.e., imperative function), since in this case the unit of observation begins with Mono.just(..) and the last operation attaches the `ObservationRegistry` to the subscriber.

If there is an observation already attached to the subscriber, it will be used to create a child Observation for the chain/segment upstream of `tap`, however as we already stated, by default, the framework does not attach any Observation to the stream chains you return.