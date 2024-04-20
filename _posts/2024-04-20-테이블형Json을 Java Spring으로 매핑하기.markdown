---
layout: post
---
### 0
 External API를 Request 하고 Response 처리하여 적절히 DB Save 해야하는 Requirement 가 생겼다. Response JSON 의 schema 는 다음과 같았다. By ChatGPT. 이어서 example data 다.
```json
{
  "$schema": "",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "domainId": {"type": "string"},
      "columns": {"type": "array", "items": {"type": "string"}},
      "rows": {"type": "array","items": {"type": "array","items": {"type": "string"}}
      }
    },
    "required": ["domainId", "columns", "rows"]
  }
}
```
 
```json
[
  {
    "domainId": "AA",
    "columns":["a","e","g"],	
    "rows" : [ 
      ["foo", "2021-12-01", ""],
      ["foo", "2021-12-02", "dw"]
    ]
  },
  {
    "domainId": "BB",
    "columns":["a","f","k","r"],
    "rows" : [
      ["foo", "foo", "", "lol"],
      ["foo", "", "sa", ""],
      ["fir", "foo", "", "ti"]
    ]
  },
  {
    "domainId": "xx",
    "columns":["a"],
    "rows" : [
      [""]
    ]
  }
]
```

data feature 은 meet the requirement 하는데 다음과 같은 difficulties 가 있었다. 

1. items 의 수는 0 or greater 이며 0일 때 Response empty array.
2. domainId has multiple Enumerated type.
3. columns 은 일부만 고정이며 나머지는 variable 하다. 다만 columns array size == single row's size.

Our project has been using JPA, so I need to make each Entity class from this.


### 1
![클래스 설계](/img/Column-oriented%20JSON%20to%20POJO-JsonResponseDomainMapper.png)

모듈의 워크플로우는 다음과 같다. JsonResponseDomainMapper 가 외부로부터 가져온 JsonResponse 인자로 구현체를 통해 각각의 단위에 따라 DomainMapperFactory를 호출한다. 호출된 DomainMapperFactory 는 적절한 DomainMapper 를 조립하기 위해 넘겨받은 DomainCode를 통해 domainId 문자열로 타입을 정하고 타입과 컬럼리스트를 가지고 RowMapperSupplier 를 통해 컬럼을 각각 순서대로 매핑할 람다함수 리스트인 rowMapper를 얻는다. 마지막으로 앞서 넘겨받은 Rows까지 3개의 인자로 DomainMapper 를 생성해 클라이언트인 JsonResponseDomainMapperImpl 에게 전달해준다. JsonResponseDomainMapperImpl 는 전달받은 DomainMapper를 모아서 doMap()으로 List<DomainEntity>를 만들 수 있다. 결과적으로 JsonResponse 의 items 은 각 타입에 맞는 AAEntity 또는 BBEntity 로 매핑되어 하나의 List<DomainEntity>로 반환된다. JsonResponseDomainMapper의 클라이언트는 해당 List<DomainEntity>를 활용하여 DB에 SAVE 할 수 있다.

클래스 설계에 핵심적인 부분은 다음과 같다.
1. JsonResponse 의 domainId 가 시스템에서 받아들일 수 없을 경우를 대비하여 핵심적인 DomainMapperFactory , DomainCode 가 해당 의존관계를 가지지 않게 하였다. 
2. DomainCode 가 Repository Layer 의 엔티티 객체나 각 엔티티별 ColumnDomainMapStrategy 에 대한 정보를 저장하고 중개함으로써 DomainMapperFactory 와 RowMapperSupplier 가 직접 의존을 하지 않도록 했다.
3. DomainMapperFactory 가 만든 DomainMapper 가 구체적인 DomainEntity 타입을 모르게 제네릭을 적용했으며 RowMapperSupplier 를 통해 가져온 rowMapper 또한 구체적인 유형에 관심가지지 않아도 되며 getNewInstance() 또한 DomainMapperFactory 와 DomainCode 의 getDomainClass(DomainCode domainCode) 메소드로 가져온 Class 를 리플렉션으로 NewInstance()로 생성하므로 Mapper는 DomainMapper 의 잠재적인 의존을 모두 줄였다.
4. 의존관계의 최소화하여 유지보수성을 높였다. 만약 대응할 DomainEntity 가 늘어난다면 수정해야할 곳은 매우 한정적이다. DomainCode 에 해당 DomainEntity 상속 엔티티와 새로만든 ColumnDomainMapStrategy 를 추가해주면 된다.

### 2

 앞서 소개한 JsonResponseDomainMapper 클래스를 설계하고나서 다음과 같은 문제점을 발견했다. 
 1. ColumnDomainMapStrategy 가 제공하는 BiConsumer<DomainEntity, String> 람다 익명함수는 DomainEntity 를 상속한 하위타입의 공개된 프로퍼티로 접근 가능하다. 만약 프로퍼티가 공개되지 않는다면 해당 엔티티에 리플렉션 등의 우회접근이 강제되거나 불필요한 Setter 추가를 요구받게 된다. 만약 비지니스 로직이 엔티티에 정의된 경우 해당 비지니스로직과의 충돌의 위험이 있다.
2. 해당 맵퍼는 DomainEntity 상속 엔티티의 추가에는 확장이 쉽지만 DomainCode 의 getDomainClass() 단 하나의 엔티티만 매핑하기 때문에 JsonResponse 에 상속을 받지 않는 다른 엔티티의 정보가 혼재한다면 이를 처리할 수 없다.
3. 그와 더불어 목적 엔티티와 연관관계를 갖는 다른 엔티티가 존재한다면 그것을 확인하여 연관관계를 맺어줄 로직이 전혀 없고 해당 기능을 확장할 여지가 존재하지 않는다. 
4. 그렇다고 해서 해당맵퍼의 기능을 확장하여 다른 엔티티를 가져와 연관관계를 맺게 해준다면 맵퍼의 로직이 Repository 나 Domain Layer 에 지나치게 의존하기 때문에 유지보수에 치명적이다.

 따라서 이를 해결하기 위해 DTO를 사용하여 의존성을 분리했다.

아래는 설계도이다.

![설계2](/img/Column-oriented%20JSON%20to%20POJO%20ver2-JsonResponseDomainMapper_ver_2.png)
