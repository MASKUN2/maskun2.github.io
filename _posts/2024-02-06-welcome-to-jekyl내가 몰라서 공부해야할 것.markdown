---
layout: post
title:  "공부의 흔적"
date:   2024-02-05 21:12:58 +0900
categories: spring
---

인터페이스와 추상클래스 전략패턴 구조 정도

Collection API(각 자료구조 차이와 API사용법)

날짜 API

I/O (보면서 데코레이터 패턴에 대해서 한번 보면 좋음)

N I/O(n이 new인지 nonblock인지 신경 쓰지말고 이런 게 있구나 정도로만, 채널이란걸 사용한다 정도만 알고 있으면 됩니다. 추가 공부는 나중에)

예외처리(자바 예외처리 클래스 구조도 암기, 얘도 짬차야 예외처리 왜하는지 감이 와서 일단 개념 암기)

Throwable, Number 인터페이스 (레거시 코드catch문에 당연하다는듯이 Exception ex )

[[Spring] 38. 스프링에서 URI 조립을 위한 UriComponentsBuilder
[출처] [Spring] 38. 스프링에서 URI 조립을 위한 UriComponentsBuilder|작성자 Do KY](https://blog.naver.com/PostView.naver?blogId=aservmz&logNo=222322019981)
공공데이터 엔드포인트로 HTTPS 리퀘스트를 보냈던 예시의 예전의 java.net API를 스프링 RestTemplate로 구현해보려고 했는데 URI빌더에 차이가 있음을 깨달았다. 해당 블로그를 보고 공부해야겠다.

- JACKSON API
  - `이슈`  JACKSON API가 생소해서 XML->JSON한 JSONNODE에서 원하는 노드의 데이터를 찾아서 매핑하는 과정이 어려웠음
  - `고민` : chat GPT에게 물어봐도 JAXB, o3g.DOM를 알려주는 등 요즘 추세와 조금 다른 점이 있었다. 특별히 계층형 트리구조 JSON이어서 시행착오가 많았다. A:{[B,C]} 의 노드를 탐색할 때 Jsonnode.findValue("A")를 하게 되면 "{[B,C]}" 를 사이즈 1의 배열로 인식하는 점이 문제였다. 따라서 B에 접근하려면 Jsonnode.findValue("A").get(0)을 한 후 접근하는 방식을 했더니 메소드 체이닝도 안됐다. 
  - `해결` 루트노드를 구한 후 .path()를 반복해 계층을 하나씩 파고들어 .path("body").path("item").path("A")을 하니까 List<JsonNode> 타입으로 리턴되었다. 이후 정상적으로 objectMapper로 매핑할 수 있었다. 
  - `반추` 여전히 JACKSON에 대한 이해도가 떨어지는데 향후 API 개발에 있어 빈번하게 사용될 것 같으니 공부해둬야겠다.

- Redis, JS에 대해서
  - Redis를 굳이 현 시점에서 공부할 필요가 없을 것 같다는 생각이 든다. 왜냐면 신입의 기준에서 코어기술인 스프링이나 자바에 등 기본기에 좀 더 집중해야겠다는 생각이 든다.  

- [ajax의 put 요청시 datatype을 json으로 지정](https://timulyslog.tistory.com/557)했더니 응답이 json으로 오지 않으면 전부 error 뜨는 것을 확인했다. 왜 오류가 뜨는지 몰랐는데 메소드를 잘 몰라서 그랫던 것 같다. 

- [스프링부트에서 서비스에 인터페이스를 사용해야하는가에 대한 분석](https://velog.io/@hsw0194/Spring-Boot%EC%97%90%EC%84%9C-interface%EB%A5%BC-%EC%82%AC%EC%9A%A9%ED%95%B4%EC%95%BC-%ED%95%A0%EA%B9%8C) 컨트롤러와 서비스의 비지니스 로직에 있어 다른 서비스를 참조하거나 교체되지 않는 간단하고 선형의 관계일 때는 굳이 필요하지 않을 것같다. 다만 빈번한 서비스 교체가 필요하고 하나의 서비스에서 다른 서비스를 호출하는 등 서비스끼리 서로를 의존하게 되는 경우 서비스 사이에 인터페이스를 제공할 수 있다. 이 때 한 서비스의 변경이 다른 서비스를 변경하도록 제어하는 것이 아니라. 한 서비스의 인터페이스 오버라이드 메소드를 변경하더라도 영향을 주지 않고 다른 서비스가 격리되어 독립적으로 유지된다. 
- "스프링부트에서 서비스에 인터페이스를 사용해야하는가"에 대한 추가적인 생각정리; 1:1:1형식의 서비스 빈의 교체나 상속이 이뤄지지 않는 단순한구조에서는 분명 인터페이스로 코드의 복잡도를 높일 필요는 없다는 의견에 동의했다. 그러나 실제로 다이어리 프로젝트를 하면서 서비스 클래스의 이름이나 파라미터를 수정해야할 일이 많았는데 이럴 때마다 IDE로부터 Test작성을 해두었던 것에 다소 번거로운 수정을 요구받게 되었다. 컨트롤러와 서비스 클래스가 직접 연관되다보니 생각문제였다. 단위테스트가 서비스의 인터페이스를 의존한다면 의존성주입으로 편리하게 해결될 문제였지만 인터페이스가 없어서 그러지 못했다. 따라서 인터페이스에 테스트작성의 편리함을 주는 면도 있어서 차용하는 것도 생각하게 되었다. 
- 인터페이스의 명명법에 대해서; 주로 인터페이스를 IService로 하고 구현클래스를 ServiceImpl로 명명하는 듯하다. 좀더 전략패턴적인 명명법도 알게되었다. Map인터페이스가 HashMap, LinkedHashMap 등의 클래스로 구현되는 것처럼 구현클래스의 이름에 좀더 자세한 기술을 하는 방식의 명명법이다. 가독성의 장단이 있으리라 생각이든다. 팀프로젝트에서, 특별히 복수의 구현체의 리볼빙이 이뤄지지 않는 상태에서는 I, Impl가 좋을듯하다.

- 스프링컨트롤러에서 객체로 인자를 설정하여 html요청값을 받을 때 boolean 값을 받기가 난해했다. 객체에 boolean 값을 넣고 인풋으로 true를 받아도 false가 입력되었다. [찾아본 바](https://kbwplace.tistory.com/167)로는 객체 매핑시 setter를 사용하는데 boolean의 경우 setter가 아닌 is를 사용한다고 한다. 이는 Boolean으로 타입을 변경함으로 해결되었다. 또한 마이바티스는 TINY(1)에 0, 1을 입력시킴으로 자바 객체의 Boolean 값을 성공적으로 매핑할 수 있었다.

- 로컬에서 new 연산자로 선언된 RestTemplate은 StringHttpMessageConverter의 우선순위는 여기에서 선언된 것과 차이가 있었다.
* 스프링 빈으로 생성될 경우 공공데이터의 xml response를 자동으로 json 으로 convert 해주었다. 이 점을 유의할 것.
*
* 만약 MappingJackson2HttpMessageConverter 가 MappingJackson2XmlHttpMessageConverter 보다 우선순위라면 이같은 일이 발생한다.
```
RestTemplate restTemplate = new RestTemplate();
restTemplate.getMessageConverters().forEach(System.out::println);
restTemplate.getMessageConverters().add(0, new StringHttpMessageConverter(StandardCharsets.UTF_8));
System.out.println("----------------------------");
restTemplate.getMessageConverters().forEach(System.out::println);

결과(아래)
org.springframework.http.converter.ByteArrayHttpMessageConverter@2b6262bc
org.springframework.http.converter.StringHttpMessageConverter@5cffec7
org.springframework.http.converter.ResourceHttpMessageConverter@7e81617a
org.springframework.http.converter.support.AllEncompassingFormHttpMessageConverter@6e73974
org.springframework.http.converter.xml.MappingJackson2XmlHttpMessageConverter@3e28dc96
org.springframework.http.converter.json.MappingJackson2HttpMessageConverter@44eb2452
----------------------------
org.springframework.http.converter.StringHttpMessageConverter@e07b4db
org.springframework.http.converter.ByteArrayHttpMessageConverter@2b6262bc
org.springframework.http.converter.StringHttpMessageConverter@5cffec7
org.springframework.http.converter.ResourceHttpMessageConverter@7e81617a
org.springframework.http.converter.support.AllEncompassingFormHttpMessageConverter@6e73974
org.springframework.http.converter.xml.MappingJackson2XmlHttpMessageConverter@3e28dc96
org.springframework.http.converter.json.MappingJackson2HttpMessageConverter@44eb2452
```

```
@Configuration
public class RestTemplateConfig {
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder restTemplateBuilder) {
        return restTemplateBuilder
                .requestFactory(() -> new BufferingClientHttpRequestFactory(new SimpleClientHttpRequestFactory()))
                .setConnectTimeout(Duration.ofMillis(5000))
                .setReadTimeout(Duration.ofMillis(5000))
                .additionalMessageConverters(new StringHttpMessageConverter(Charset.forName("UTF-8")))
                .build();
    }
}

결과 응답이 xml이 와도 json으로 컨버터 되었다. (아래)
org.springframework.http.converter.ByteArrayHttpMessageConverter@31120021
org.springframework.http.converter.StringHttpMessageConverter@1a8b81e8
org.springframework.http.converter.StringHttpMessageConverter@3df1a1ac
org.springframework.http.converter.ResourceHttpMessageConverter@58606c91
org.springframework.http.converter.ResourceRegionHttpMessageConverter@6a9cd0f8
org.springframework.http.converter.support.AllEncompassingFormHttpMessageConverter@4baed682
org.springframework.http.converter.json.MappingJackson2HttpMessageConverter@5e8507f1
org.springframework.http.converter.json.MappingJackson2HttpMessageConverter@7be2f29a
org.springframework.http.converter.xml.MappingJackson2XmlHttpMessageConverter@234cff57
org.springframework.http.converter.xml.MappingJackson2XmlHttpMessageConverter@203d1d93
org.springframework.http.converter.StringHttpMessageConverter@5b5a4aed
----------------------------
org.springframework.http.converter.ByteArrayHttpMessageConverter@31120021
org.springframework.http.converter.StringHttpMessageConverter@1a8b81e8
org.springframework.http.converter.StringHttpMessageConverter@3df1a1ac
org.springframework.http.converter.ResourceHttpMessageConverter@58606c91
org.springframework.http.converter.ResourceRegionHttpMessageConverter@6a9cd0f8
org.springframework.http.converter.support.AllEncompassingFormHttpMessageConverter@4baed682
org.springframework.http.converter.json.MappingJackson2HttpMessageConverter@5e8507f1
org.springframework.http.converter.json.MappingJackson2HttpMessageConverter@7be2f29a
org.springframework.http.converter.xml.MappingJackson2XmlHttpMessageConverter@234cff57
org.springframework.http.converter.xml.MappingJackson2XmlHttpMessageConverter@203d1d93
org.springframework.http.converter.StringHttpMessageConverter@5b5a4aed
```

validation에 대해 공부하면서 javaBeanValidator에 대해 알게 되었고 컨트롤 전단에서 argumentResolver 의 dataBinding과정에서 @vaild 애노테이션이 작동한다는 것을 알았다. 또한 이과정에서 검사결과가 Erros errors 빈으로 저장되며 형태에 따라 FieldError에 자동저장되는 것을 알았다. 또한 model에 곧바로 BindingResult에 해당 Errors 들이 저장된다는 것을 알았다.그리고 태그라이브러리를 추가해서 JSP에 해당 에러들을 출력하는 것도 가능하다는 것을 알았다.


그간 많은 부분을 공부했다. DTO에 대한 고민도 했고 헥사고날아키텍쳐, 스프링 인터셉터와 스프링시큐리티에 대해 개론적으로 훑어보았다.

공부를 하면서 느끼는거지만 내가 모르는 것은 너무 많고 특히나 5년이내에 부상한 기술들에 대해 관심을 갖게되었다.

그러나 다시 뿌리로 돌아오기로 했다. 
스프링시큐리티 보다는 세션,필터, 인터셉터를 이용한 방식으로.
JPA보다는 Mybatis의 동적쿼리나 고급SQL문법을 사용하는 것을.
계층간 완벽한 도메인 dto분리보다 WebDto 과 application 영역의 Dto로.
또한 스프링이 제공하는 여러 핵심기능에 집중하고 좀 더 깊이 파보는 편이 좋겠다고 생각했다. 그것은 서버사이드 밸리데이션과 에러 핸들링, 예외처리와 단위테스트 같은 것이다. 
자바도 마찬가지다. IO와 exception, 그리고 collection 과 자바8API들.
