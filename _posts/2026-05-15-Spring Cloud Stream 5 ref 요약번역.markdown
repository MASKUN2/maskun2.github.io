---
layout: post
title:  "Spring Cloud Stream 5 레퍼런스 요약 번역"
categories: [Spring Cloud Stream]
---
# Spring Cloud Stream 5 레퍼런스 요약 번역
https://docs.spring.io/spring-cloud-stream/reference/index.html
원문을 읽고 공부하고 요약하여 내 지식으로 만들기

## A Brief History of Spring’s Data Integration Journey

클라우드 마이크로서비스가 엔터프라이즈에 중요해짐에 따라 스프링 데이터 통합과 스프링부트가 합쳤고 스프링 클라우드 스트림이 생겨나게 되었다. 스프링 클라우드 스트림은 개발자에게 데이터 중심의 마이크로서비스 아키텍쳐에서 서비스를 개발하는데에 여러 편의를 제공한다.

### 5분 레시피
스프링 클라우드 스트림의 컨셉을 이해하기 위한 메세지 수신로깅 학습 테스트가 있다. 스프링 이니셜라이저로 Cloud Stream과 원하는 RabbitMQ 의존성을 추가해 프로젝트를 빌드한다. 아래와 같이 빈을 작성하면 자동으로 수신핸들러로 등록된다.
```java
@Bean
public Consumer<Person> log() {
    return person -> System.out.println("Received: " + person); //Person은 name 필드를 가지는 DTO
}
```
이제 RabbitMQ가 실행된 상태에서 스프링부트를 실행하고 메세지를 보내면 콘솔로그가 프린트된다.


### Spring Expression Language 사용 주의
스프링 클라우드 스트림에서 메세지는 Message<byte[]> 타입으로 수신된다. raw 타입이니 여기에 SpEL로 페이로드를 조회하여 라우팅하거나 하지말자. 메세지 헤더에 읽기 좋은 문자열 정보를 넣고 이것을 SpEL로 읽는 것이 더 안전하고 업계표준이다.

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
# 예시
spring.cloud.stream.bindings.func-out-0.producer.partitionKeyExpression=headers.id # SpEL
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
