---
layout: post
categories: [ Spring Cloud Stream ]
---

# Spring Cloud Stream 5

https://docs.spring.io/spring-cloud-stream/reference/index.html

원문을 읽고 공부하고 요약하여 내 지식으로 만들기

## A Brief History of Spring’s Data Integration Journey

클라우드 마이크로서비스가 엔터프라이즈에 중요해짐에 따라 스프링 데이터 통합과 스프링부트가 합쳤고 스프링 클라우드 스트림이 생겨나게 되었다. 스프링 클라우드 스트림은 개발자에게 데이터 중심의 마이크로서비스 아키텍쳐에서 서비스를 개발하는데에 여러 편의를 제공한다.

### 5분 레시피

스프링 클라우드 스트림의 컨셉을 이해하기 위한 메세지 수신로깅 학습 테스트가 있다. 스프링 이니셜라이저로 Cloud Stream과 원하는 RabbitMQ 의존성을 추가해 프로젝트를 빌드한다. 아래와 같이 빈을 작성하면 자동으로 수신핸들러로 등록된다.

```java

@Bean
public Consumer<Person> log() {
  //Person은 name 필드를 가지는 DTO
  return person -> System.out.println("Received: " + person);
}
```

이제 RabbitMQ가 실행된 상태에서 스프링부트를 실행하고 메세지를 보내면 콘솔로그가 프린트된다.

### Spring Expression Language 사용 주의

스프링 클라우드 스트림에서 메세지는 Message<byte[]> 타입으로 수신된다. raw 타입이니 여기에 SpEL로 페이로드를 조회하여 라우팅하거나 하지말자. 메세지 헤더에 읽기 좋은 문자열 정보를 넣고 이것을 SpEL로 읽는 것이 더 안전하고 업계표준이다.

## Main Concepts and Abstractions

### The Binder Abstraction

스프링 클라우드 스트림은 커스텀 구현이 가능한 바인더 추상을 정의하고 카프카와 레빗MQ에 대해 테스트를 포함하는 바인딩 구현체를 제공한다. 관련 설정이 스프링부트 방식으로 동적 적용이 가능하며 스프링부트가 바인더를 클래스 패스에서 찾기 때문에 복수의 미들웨어에 대한 통합도 가능하다.

```yaml
# 예시) 입력 바인딩 네임: uppercase-in-0
# 예시) 출력 바인딩 네임: uppercase-out-0
spring.cloud.stream.bindings.<bindingName>
```

### Consumer Groups

![SCSt groups](/spring_cloud_stream_docs-5.0.1/images/SCSt-groups.png)
스케일업이 필요한 환경에서 특정 메세지를 처리하고자하는 컨슈머가 늘어나게 되면 일종의 경쟁구조를 가지게된다. 이에 스프링 클라우드 스트림은 한 컨슈머 그룹안에서는 한 멤버 컨슈머만 메세지를 전달받도록 하여 이 문제를 해결한다. 프로퍼티 설정은 `spring.cloud.stream.bindings.<bindingName>.group={groupName}`로 지정한다. 지정되지 않은 바인더는 독립 그룹으로 자동 지정된다.

### Partitioning

![SCSt partitioning](/spring_cloud_stream_docs-5.0.1/images/SCSt-partitioning.png)
스프링 클라우드 스트림은 데이터의 특징에 따라 동일 컨슈머가 처리하도록 할 수 있는 파티셔닝과 추상화를 제공한다. 특별히 타임원도우 계산과 같은 유즈케이스에서는 파티셔닝이 중요하고 데이터의 I/O를 모두 그것에 맞도록 설정해야한다.

#### Configuring Output Bindings for Partitioning

아웃바인더의 파티셔닝 설정은 `partitionKeyExpression` 와 `partitionKeyExtractorName` 중 하나를 이용하고 `partitionCount`를 지정하면 됩니다.

```yaml
# SpEL 을 사용하는 경우
spring.cloud.stream.bindings.func-out-0.producer.partitionKeyExpression=headers.id
  # org.springframework.cloud.stream.binder.PartitionKeyExtractorStrategy 구현체 bean을 사용하는 경우
  # spring.cloud.stream.bindings.func-out-0.producer.partitionKeyExtractorName=customPartitionKeyExtractor
spring.cloud.stream.bindings.func-out-0.producer.partitionCount=5 # 파티션 갯수
```

아웃바운드 데이터의 파티션은 인덱스가 0부터 시작하며 선택 기본 로직은 `key.hashCode() % partitionCount` 입니다. 이것 또한 필요하다면 커스텀 가능합니다.

```yaml
# PartitionKeyExtractorStrategy 을 구현한 커스텀 파티션 선택기 bean을 지정
spring.cloud.stream.bindings.func-out-0.producer.partitionSelectorName=customPartitionSelector
```

#### Configuring Input Bindings for Partitioning

```yaml
spring.cloud.stream.bindings.uppercase-in-0.consumer.partitioned=true # 파티셔닝 설정 ON

  # Native partitioned binding을 지원하지 않는 RabbitMQ 경우 필수임
  # 카프카의 경우 `autoRebalanceEnabled(default true)`로 자동 배분하지만 정밀한 제어가 필요한 경우 옵션을 끄고 지정이 가능함.
spring.cloud.stream.instanceIndex=3 # 현재 인스턴스 인덱스 (0부터 시작), 파티션과 무관
spring.cloud.stream.instanceCount=5 # 처리 가능한 인스턴스 갯수
```

### programing model

![SCSt overview](/spring_cloud_stream_docs-5.0.1/images/SCSt-overview.png)

`Destination Binders`는 외부 미들웨어와의 통합에 있어 기반 시스템을 제공한다.

### Functional binding names

`Bindings`는 함수형인터페이스로 정의한 `@Bean` 인스턴스로 프로듀서/컨슈머이며 메세지 전달받은 페이로드에 대한 커스텀 파이프라인을 정의한다.
앱 프로퍼티에 `spring.cloud.stream.bindings.<bindingName>`에 들어가는 `binding names`에는 관례적인 규칙이 있는데 이런 식이다.
> 함수이름 + -in또는out- + 함수객체의 인덱스번호

그래서 `spring.cloud.stream.bindings.uppercase-in-0.destination=my-topic`와 같이 적을 수 있고 destination은 목적지(수신자, 발신자) 카프카에서는 topic이라고 보면된다.

특정 바인딩 네임에 대해 별칭을 줄수도 있다. `spring.cloud.stream.function.bindings.uppercase-in-0=input`으로 지정하면 `spring.cloud.stream.bindings.input.destination=my-topic`으로 참조할 수 있게 된다. 다만 `explicit binding name` 방식과 혼동될 수 있으므로 추천하지는 않는다.

두개 이상의 함수 빈 인스턴스를 먼저 `spring.cloud.function.definition`에 `;` 구분자로 지정하면 자동으로 바인딩 규칙에 따른 in-0 , out-0 바인딩이 된다.

### Explicit binding creation

함수형 바인딩은 보통 메세지 수신이 트리거가 되는데 메세지 스트림을 직접 조작해야할 일이 생긴다. 예를 들어 HTTP 요청을 받아서 이를 메세지 스트림에 발행해야하는 경우가 있겠다. 스프링 클라우드 스트림은 명시적 바인더이름을 선언하면 `StreamBridge`으로 조작가능한 바인더를 자동으로 만들어준다.

```yaml
spring.cloud.stream:
  input-bindings=fooin;barin  # ; 로 여러개 선언가능
  output-bindings=fooout;barout
```

### Binding visualization and control

스프링 클라우드 스트림은 Actuator 엔드 포인트나 프로그래밍방식을 통해 바인딩을 시각화하고 조작할 수 있도록 해준다.

#### Programmatic way

3.1 버전부터  `org.springframework.cloud.stream.binding.BindingsLifecycleController`가 자동으로 등록된다. 아래처럼 활용가능하고 바인딩을 새로 만들거나 상세 프로퍼티도 조작할 수 있다.

```java
//BindingsLifecycleController을 찾고 바인딩을 확인하기
BindingsLifecycleController bindingsController = context.getBean(BindingsLifecycleController.class);
Binding binding = bindingsController.queryState("echo-in-0");

assertThat(binding.isRunning()).

isTrue();
bindingsController.

changeState("echo-in-0",State.STOPPED);

//Alternative way of changing state. For convenience we expose start/stop and pause/resume operations.
//bindingsController.stop("echo-in-0")
assertThat(binding.isRunning()).

isFalse();
```

#### Actuator

의존성을 로드하고 `management.endpoints.web.exposure.include=bindings`을 추가하면 기동시 API가 등록된다는 로그를 볼 수 있다. `<host>:<port>/actuator/bindings`에서 볼 수 있다. 조작 기능은 미들웨어에 따라 지원여부가 다르니 확인후 사용한다.

##### Sanitize Sensitive Data

엑츄에이터를 사용하면 민감정보가 노출될 수 있다. `SanitizingFunction`으로 해결한다.

```java

@Bean
public SanitizingFunction sanitizingFunction() {
  return sanitizableData -> {
    if (sanitizableData.getKey().equals("sasl.jaas.config")) {
      return sanitizableData.withValue("data-scrambled!!");
    } else {
      return sanitizableData;
    }
  };
}
```

### Producing and Consuming Messages

스프링 클라우드 스트림은 `Function` and `Consumer`와 같은 함수형 구현을 추천한다. 함수형 싱글 빈들은 기본적으로 `spring.cloud.stream.function.autodetect=true`자동 감지되어 함수이름을 조합하여 `toUpperCase-in-0`와 같은 자동생성이름으로 바인더에 등록되긴 하지만 혼란을 줄이기 위해서 명시적으로 `spring.cloud.function.definition`프로퍼티로 함수이름을 지정하는 것도 권장된다.

#### Suppliers (Sources)

`Function` and `Consumer`와 다르게 `Supplier`는 in 으로 바인딩이 되는 것이 아니다. 대신 프레임워크의 default polling mechanism에 따라 `1초` 마다 invoked 된다. 이러한 풀링은 커스텀도 가능하다.

그리고 `Flux<String>`을 반환하는 서플라이어 타입인 경우 처음 1회만 호출된다. 무한 스트림인경우에는 호출 후 그것이 유지될 것이고 유한 스트림인 경우에는 폴링이 필요한 경우가 있어서 `@PollableBean`을 사용하여 폴링이 이뤄지도록 지원한다. 이경우 애노테이션에 기본으로 `splittable=true`으로 유한 스트림을 모아서 하나의 메세지로 보낼지 여부를 선택 가능한다.

서플라이어 빈은 태생상 요청 스레드에 의해 제어되지 않으므로 스레드 문제가 발생할 여지가 있다. 이를 명시적으로 관리하기 위해서는 서플라이어 빈을 지정하는 대신 `StreamBridge`로 같은 기능을 직접 관리하는 것이 권장된다.

#### Consumer (Reactive)

리액티브 컨슈머는 반환타입이 void이기 때문에 함수바디가 구독 `.subscribe()`을 하지 않아도 작성이 가능해서 잘못하면 혼란이 발생할 수 있다. 대신 명시적으로 `flux -> flux.map(..).filter(..).then()` 처럼 `Function<Flux<?>, Mono<Void>>` 로 작성하는게 권장된다.

##### Polling Configuration Properties

`spring.integration.poller.`로 시작하는 프로퍼티로 기본 폴러의 인터벌,cron 설정이 가능하다. 개별 바인더에 대한 폴러는 `spring.cloud.stream.bindings.supply-out-0.producer.poller.`로 시작하는 설정을 추가함으로서 가능하다.

#### Sending arbitrary data to an output (e.g. Foreign event-driven sources)

만약 REST API로 전달받은 데이터를 이벤트 스트림에 푸시해야하는 경우. 웹 스코프에서 `streamBridge.send(바인딩이름, obj)`과 같이 사용할 수 있다.
바인딩 이름은 있고 함수가 없어도 프레임워크가 동적으로 이를 대신하여 푸시한다. 바인딩 이름을 사전에 지정하지 않는 경우에도 바인딩 이름을 토픽으로 간주하고 푸시를 진행하긴하는데 권장되진 않는다.
인자로 전달되는 메세지 타입은 오브젝트이고 POJO or `Message`타입으로 보낼 수 있다.

streamBridge는 기본적으로 호출하는 스레드를 사용하지만 비동기로 보내야하는 경우 관련 옵션을 사용할 수 있다. 비동기 전송의 관측가능성을 위해 micrometer의 context-propagation을 사용할 수도 있다.

스프링클라우드 스트림은 StreamBridge.send() 로 전달하는 바인딩 이름이 없는 경우 자동으로 그것을 바인더로 생성하고 동일한 이름의 destination(topic)으로 매핑한다. 다만 캐시 용량이 기본적으로 제한되어있고 크기를 제어할 수 있으나 메모리 리크 우려가 있어 권장되지 않는다.

public boolean send(String bindingName, Object data, MimeType outputContentType) 메서드를 사용하여 컨텐츠 타입 지정이 가능하다.

기본적으로 `spring.cloud.stream.output-bindings` 와 같이 바인더를 지정한것과는 별개로 StreamBridge에서 동적 바인더 생성시에는 명시적으로 바인더 타입을 지정해줄 수도 있다. `public boolean send(String bindingName, @Nullable String binderType, Object data)` 와같은 메서드를 사용하면 된다. 단 바인더 이름은 프로퍼티를 우선한다.

StreamBridge은 아웃 바인딩을 만들때 (글로벌/커스텀)채널 인터셉터를 지정해줄 수도 있다.

#### Reactive Functions support

기본적으로 스프링 클라우드 스트림은 리액티브를 지원하긴한다. 다만 imperative와는 패러다임이 다르므로 프레임워크에 덜 의지하는 방식의 코드 작성이 필요하다

스트림 복수를 하나의 핸들러에서 처리하거나 하나의 핸들러에서 여러 핸들러로 메세지를 수신하는 방법이 있다. 리액터와 튜플자료형을 사용하는데 이 요약본에서는 정리하지 않기로 했다.

#### Functional Composition

함수형 메세지 핸들러를 조합한 방식의 바인딩도 제공한다. `spring.cloud.function.definition=toUpperCase|wrapInQuotes` 처럼 파이프라인으로 두개의 함수형 핸들러를 묶을 수 있고 저 선언 자체를 바인딩 이름처럼 쓸 수 있다. 이러한 방식은 횡단 관심사를 처리하기 위한 어드바이스를 마치 함수형 핸들러로 적용하는 것처럼 쓸 수도 있다.

#### Batch Consumers

`pring.cloud.stream.bindings.<binding-name>.consumer.batch-mode`를  `true`로 하면 `Function<List<Person>, Person>`와 같이 배치 컨슈머를 사용할 수 있다.

The headers of batched messages are created by binders like `amqp_batchedHeaders` or `kafka_batchConvertedHeaders`, respectively.

If a message represents batched many messages, it'll have `MessageHeaders` contains a set of all message headers.

The fail-control of message conversion is depending on the function's signature and an implementation of `MessageConverterHelper` interface.

When its payload fails for conversion, the framework tries to invoke your function with the raw message. If the function is expected POJO as arguments, it'll be thrown an exception. In a batch process, a failed payload is removed and effectively reduces the batch size without any exception.

And the default implementations of `MessageConverterHelper` for Kafka and Rabbit automatically remove the header of the failed to conversion message from its header set.

#### Batch Producers

You can produce many messages at once by using `Function<String, List<Message<String>>>` signature.

#### Spring Integration flow as functions

It supports Spring Integration (SI) like this.

```java

@Bean
public IntegrationFlow uppercaseFlow() {
  return IntegrationFlow.from(MessageFunction.class, spec -> spec.beanName("uppercase"))
    .<String, String>transform(String::toUpperCase)
    .log(LoggingHandler.Level.WARN)
    .bridge()
    .get();
}

```

### Using Polled Consumers
If you need an individual input binding for a destination, the Polled Consumer is useful.
You can bind it like `spring.cloud.stream.pollable-source=myDestination` and you and wire it as `@Qualifier("myDestination-in-0") PollableMessageSource destIn` ,then use method `boolean poll(Message<?> message)`)`

By default, if an error occurs in the message handler, the message is rejected without re-queueing. In Kafka, this results in committing the offset to move forward to the next message

You also can override the behavior of acknowledgment in PollableMessageSource's poll() method for Error handling.

#### Handling Errors
By default, an error channel is configured for the pollable source; if the callback throws an exception, an ErrorMessage is sent to the `error channel` `<destination>.<group>.errors` this error channel is also bridged to the `global Spring Integration errorChannel`. But it is not automatically created external bindings.

You can subscribe either with `@ServiceActivator`. If neither channel is subscribed, the error will be simply logged and acknowledged as successful. If the activator service throws `RequeueCurrentMessageException, the message will be re-queued. When the other exceptions are thrown, it'll be rejected by default.

Since Error handling is important, I recommend following the best practice or convention of your industry.
