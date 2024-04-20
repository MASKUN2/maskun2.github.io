Pageable 구현체, RequestPage는 현재 pageNumber, pageSize 를 프로퍼티로 가지고 있다. 

그런데 컨트롤러단에서 파라미터로 넣는다면 쿼리스트링으로는 각각 page, size를 바인딩 키로 가져다쓴다.

 아마도 예전에는 page, size가 프로퍼티였던 것 같고 스프링부트가 버전업하면서 프로퍼티 명을 변경하고 아규먼트 리졸버로 바인딩규칙을 하드코딩한 듯 하다. 

https://docs.spring.io/spring-data/commons/docs/2.5.7/api/index.html?org/springframework/data/domain/AbstractPageRequest.html

https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/AbstractPageRequest.html

3버전대로 바뀌면서 이런 현상이 생긴듯하다.