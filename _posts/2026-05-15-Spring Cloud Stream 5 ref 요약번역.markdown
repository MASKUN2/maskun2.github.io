---
layout: post
title:  "Spring Cloud Stream 5 레퍼런스 요약 번역"
categories: "Spring Cloud Stream"
---
# Spring Cloud Stream 5 레퍼런스 요약 번역
읽고 공부하고 요약하여 내 지식으로 만들기

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
