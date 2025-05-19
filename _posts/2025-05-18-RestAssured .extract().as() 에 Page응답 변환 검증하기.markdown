---
layout: post
title:  "RestAssured로 Spring Data Page 응답 역직렬화 시 겪는 난관과 해결책"
date:   2024-05-19 00:00:00 +0900
categories: 
---
## RestAssured로 Spring Data Page 응답 역직렬화 시 겪는 난관과 해결책

API 테스트 자동화를 위해 널리 사용되는 RestAssured는 JSON 응답을 자바 객체로 쉽게 변환해주는 강력한 기능을 제공합니다. 하지만 Spring Data의 `Page` 객체를 직접 역직렬화하려고 시도할 때, 다음과 같은 `com.fasterxml.jackson.databind.exc.InvalidDefinitionException` 예외를 마주하는 경우가 종종 있습니다.

```
com.fasterxml.jackson.databind.exc.InvalidDefinitionException: Cannot construct instance of `org.springframework.data.domain.Page` (no Creators, like default constructor, exist): abstract types either need to be mapped to concrete types, have custom deserializer, or contain additional type information
 at ...
```

### 왜 이런 문제가 발생할까요?

이 예외는 Jackson ObjectMapper가 `org.springframework.data.domain.Page` 인터페이스의 인스턴스를 어떻게 생성해야 할지 모르기 때문에 발생합니다. 주요 원인은 다음과 같습니다.

1.  **추상 타입과 생성자의 부재:** `Page`는 인터페이스이므로 직접 인스턴스를 생성할 수 있는 생성자가 없습니다. Jackson은 객체를 생성하기 위해 기본 생성자나 `@JsonCreator` 등으로 명시된 생성자를 필요로 합니다.
2.  **구현체의 생성자 혼동:** `Page` 인터페이스의 일반적인 구현체인 `PageImpl` 클래스는 여러 개의 생성자를 제공합니다. Jackson ObjectMapper는 어떤 생성자를 사용해야 JSON 데이터를 올바르게 매핑할지 결정하는 데 어려움을 겪을 수 있습니다. 특히 JSON 데이터 구조와 `PageImpl`의 생성자 파라미터 간의 명확한 연결 정보가 없을 경우 문제가 됩니다.

### 불편한 차선책: Path()를 이용한 content 접근

물론 이 문제를 완전히 회피하는 방법은 있습니다. RestAssured의 `path()` 기능을 사용하여 `Page` 객체 전체를 역직렬화하는 대신, `content`와 같은 특정 필드에 직접 접근하여 데이터를 검증할 수 있습니다.

```java
List<String> content = RestAssured.given()
    .get("/api/items")
    .then()
    .extract()
    .path("content");

// content 리스트를 이용한 검증
assertThat(content).hasSize(10);
assertThat(content).contains("item1");
```

하지만 이 방법은 `Page` 객체가 제공하는 페이징 관련 정보 (총 요소 수, 페이지 번호, 크기 등)를 검증하기 어렵게 만들고, 테스트 코드를 장황하게 만드는 단점이 있습니다.

### 가장 효과적인 해결책: Spring Data Cloud Jackson 모듈 활용

가장 깔끔하고 강력한 해결책은 Spring Data Cloud 프로젝트에서 제공하는 Jackson 모듈을 RestAssured의 ObjectMapper에 등록하는 것입니다. 이 모듈들은 Spring Data의 `Page` 및 `Sort` 객체의 직렬화 및 역직렬화를 올바르게 처리할 수 있도록 Jackson 설정을 제공합니다.

다음과 같이 Spring Boot가 생성한 `ObjectMapper`를 가져와 해당 모듈들을 등록하고, RestAssured가 이 `ObjectMapper`를 사용하도록 설정하면 `Page` 응답을 문제없이 역직렬화할 수 있습니다.

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.RestAssured;
import io.restassured.config.ObjectMapperConfig;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.cloud.dataflow.rest.client.Jackson2DataflowObjectMapperBuilder; // Spring Data Flow Rest Client에 포함
import org.springframework.data.web.config.SpringDataJacksonConfiguration; // Spring Data Commons에 포함

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class PageDeserializationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private ObjectMapper springBootObjectMapper;

    @BeforeEach
    void setupRestAssured() {
        ObjectMapper objectMapper = springBootObjectMapper.copy(); // Spring Boot ObjectMapper를 직접 수정하지 않도록 복사본 사용
        objectMapper.registerModule(new SpringDataJacksonConfiguration.SortModule());
        objectMapper.registerModule(new SpringDataJacksonConfiguration.PageModule());

        RestAssured.port = port;
        RestAssured.config = RestAssured.config().objectMapperConfig(new ObjectMapperConfig()
                .jackson2ObjectMapperFactory((clazz, encoding) -> objectMapper));
    }

    // 이제 Page 응답을 직접 역직렬화할 수 있습니다.
    // @Test
    // void testPageResponse() {
    //     Page<Item> page = RestAssured.given()
    //         .accept("application/json")
    //     .when()
    //         .get("/api/items")
    //     .then()
    //         .statusCode(200)
    //         .extract()
    //         .as(new TypeRef<Page<Item>>() {});
    //
    //     assertThat(page.getContent()).hasSize(10);
    //     assertThat(page.getTotalElements()).isEqualTo(100);
    //     assertThat(page.getNumber()).isEqualTo(0);
    // }
}
```

위 코드에서 `SpringDataJacksonConfiguration.SortModule()`과 `SpringDataJacksonConfiguration.PageModule()`을 `ObjectMapper`에 등록함으로써 RestAssured는 `Page` 객체를 정확하게 역직렬화할 수 있게 됩니다. 이제 더 이상 불편하게 `path("content")`를 사용할 필요 없이, `as(new TypeRef<Page<Item>>() {})`를 통해 `Page` 객체 전체를 편리하게 검증할 수 있습니다.

Spring Data 기반 API를 테스트하는 환경이라면, Spring Data Cloud에서 제공하는 Jackson 모듈을 활용하여 `Page` 객체 역직렬화 문제를 해결하고 더욱 효율적이고 가독성 높은 테스트 코드를 작성하시길 바랍니다.