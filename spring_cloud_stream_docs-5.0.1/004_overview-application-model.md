# Application Model

A Spring Cloud Stream application consists of a middleware-neutral core.
The application communicates with the outside world by establishing *bindings* between destinations
exposed by the external brokers and input/output arguments in your code. Broker specific details
necessary to establish bindings are handled by middleware-specific *Binder* implementations.

![SCSt with binder](images/SCSt-with-binder.png)

Figure 1. Spring Cloud Stream Application

## Fat JAR

Spring Cloud Stream applications can be run in stand-alone mode from your IDE for testing.
To run a Spring Cloud Stream application in production, you can create an executable (or “fat”) JAR by using the standard Spring Boot tooling provided for Maven or Gradle. See the [Spring Boot Reference Guide](https://docs.spring.io/spring-boot/docs/current/reference/html/howto-build.html#howto-create-an-executable-jar-with-maven) for more details.