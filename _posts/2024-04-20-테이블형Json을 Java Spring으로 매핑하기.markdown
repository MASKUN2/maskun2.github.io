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
요구사항을 만족하기 위한 모듈의 클래스 설계를 다음과 같이 했다.

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

![설계2](/img/Column-oriented%20JSON%20to%20POJO%20ver2-JsonResponseDomainDTOMapper_ver_2.png)

 이 설계는 엔티티를 DTO를 매개로 함으로 업무로직이 엔티티 클래스와 의존하지 않게 했다. 대신 DTO가 의존을 담당하며 실질적인 엔티티 객체의 생성에 관여한다. 클라이언트는 JsonResponseDomainDTOMapper 로부터 받은 DTO로 목적하는 엔티티 객체와 연관관계가 있는 다른 엔티티 객체도 생성 가능하다. 엔티티 객체를 생성할 때에 엔티티가 지닌 생성자나 빌더를 모두 사용가능하다. OCP를 위한 설계다.
 
### 3 
 앞서 만든 설계에는 입력타입에 의한 근본적인 문제가 있다. JsonResponse 는 3개의 필드를 가지고 있다. 이는 칼럼이 수시로 변경될 수 있기 때문에 각 리스트의 제네릭 타입을 특별히 한정할 수가 없다. 따라서 프로퍼티 값이 무엇이건간에 JSON null, 빈문자열, 문자열, 숫자, 날짜를 모두 우선 담을 수 있는 String으로 우선 응답을 받을 필요가 있다. 어떤 타입이 올지 모르기 때문에 DomainDTOMapperFactory 가 매핑 업무를 수행하기전에 유효성검사를 해야만 한다. 이것을 타입에 대한 취약점이라고 하자.

  또한 DomainDTOMapper 의 List<DomainDTO> doMap() 메소드는 Row의 size 가 column 의 사이즈가 같다는 가정하에 작동한다. 만약 다를 경우 out of bound index 예외가 발생할 취약점을 가지고 있다. 이 또한 사전에 유효성 검사를 해야한다. 이것을 리스트 사이즈에 대한 취약성이라고 하자.  

 또한 JsonResponse 의 String domainId 가 지원되지 않는 경우의 조건도 생각해서 예외처리를 해야한다. 이를 지원되지 않는 도메인 타입의 취약성이라고 하자.

또한 String domainId 와 리스트 사이즈가 모두 동일한 경우, 리스트 사이즈가 0이거나 모든 값이 null 또는 빈 문자열이여서 업무적으로 의미있는 도메인 객체 생성이 불가능할 경우도 상정해야한다. 이를 빈 데이터의 취약성 이라고 하자.

 이쯤에서 요구사항을 다시 분석하게 되었다. 추가적으로 달성해야할 요구사항 목표는 다음과 같았다.
1. 외부API 최초 포맷은 불변하지만 내부의 컬럼과 값은 수시로 변경될 수 있다.
2. 변경되는 컬럼에 따른 가변적인 매핑을 제공해야한다.
3. 외부 API 포맷과 무관하게 전처리를 거쳐 유니버셜하게 객체를 매핑할 수있는 모듈의 기능이 보장되어야한다.
4. 매핑되는 도메인 엔티티의 변경에도 OCP에 따른 유지보수가 편한 구조여야한다.

앞서 enum을 활용하여 도메인 유형에 따라서 다른 매핑 전략객체를 반환받아서 객체매핑에 사용하는 것은 유용했다. 하지만 다음과 같은 문제점이 있었다. 우선 도메인 유형에 추가될 때마다 DomainCode에 추가 상수를 입력하고 DTO를 추가로 생성하여 참조시켜야했고 해당 MapStrategy객체를 생성하여 참조시켜야했다. 이는 너무 많은 변경에 대한 영향을 초래했다. DomainEntity 추가와 별개로 Entity의 필드 이름과 타입이 변경되는 경우 RowMapperSupplier는 해당 사실을 인지하지 않고 문자열 기반의 비교만 수행하기 때문에 제대로된 RowMapper를 생성하지 못하고 db에 데이터 저장시 변경된 데이터가 빠질 수 있다. 이는 결국 엔티티의 변경이 그를 의존하는 enum과 여러 매핑객체의 변경으로 자동적으로 업데이트 되지 않기 때문이다. 따라서 현재 설계방식은 유연하지 않고 변경에도 취약하다. 따라서 Enity 매핑은 Entity 클래스 정의에 따라 자동으로 변경되어야했다. 부모 DomainEntity를 상속받는 구체화클래스의 추가에서도 자동으로 변경되어야했다. 따라서 엔티티를 정의하는 클래스의 정보가 필요했기 때문에 리플렉션으로 클래스의 정보를 파악하여 이를 동적으로 활용하는 편이 유연성이 높다고 판단되었다.

 더불어 외부 API의 컬럼이 수시로 변경될 수 있다는 말은 문자열 기반의 매핑을 수행하는 방식에서 하드코딩된 MapStrategy에 수정이 불가피하여 반복적인 배포가 수반된다는 말이다. 따라서 해당 MapStrategy의 핵심 정보는 외부소스로 빼는 방법을 고안했다.

 아래는 핵심내용을 담은 새로운 설계이다.
 
![설계3](/img/Column-oriented%20JSON%20to%20POJO%20ver3-UniverseDomainMapper_ver_3.png)

우선 JsonResponse 와 같은 외부API 응답DTO는 이 설계에서 제외했다. 본 설계는 인터페이스가 요구하는 UniverseDataUnit 객체만 UniverseDomainMapper에 제공하면 그에 따른 도메인 엔티티 객체를 반환시켜준다. 이는 인터페이스를 구현하는 행위와 비슷하다. 외부 API에서는 UniverseDataUnit를 제공할 때 컬럼과 값을 Map<String,String>형태로 제공하면된다. 하나의 row는 하나의 Map객체이다. 그리고 해당 데이터 단위의 도메인코드를 찾아서 구현되어있는 DynamicMappingSchemaRepository 를 통해 Schema를 찾아서 넣어주면 된다.

 UniverseDomainMapperImpl는 실질적인 구현체이다. 그러나 인터페이스를 통해 넘겨받은 UniverseDataUnit 의 DomainEntity provide()를 실행하여 반환시켜줄 뿐이다. 실질적인 도메인 매핑로직은 UniverseDataUnit 가 직접 수행한다. DomainCode.entitySupplier 를 통해 신규 인스턴스를 생성하고 DomainCode.fields 를 통해 해당 도메인의 목표하는 필드목록을 가져온다. DynamicMappingSchema를 통해 필드이름(internalColumName)과 일치하는 externalColumnName 를 찾고 UniverseDataUnit.DataMap에서 값을 찾는다. 해당 값을 covertStringToType(Class<?> clazz, String inputString) 하여 해당 필드에 맞는 타입으로 변환하여 리플렉션으로 매핑한다. 일반적으로 enum타입의 값 매핑의 경우 별다른 조작업이 Enum이 지원하는 정적메소드인 ValueOf(String name)으로 enum클래스는 모두 매핑가능하다. 실질적인 매핑에 필요한 타입정보, Field나 Supplier 등은 모두 도메인 엔티티를 참조하는 DomainCode로 접근가능하다. 
 
 이러한 리플렉션 도입 설계는 DomainEntity 의 CCEntity가 늘어도 해당 객체를 참조하는 CC(CC.Entity.class, ()-> CCEntity.Builder.build()) 만 DomainCode 클래스에 넣어주기만 하면 된다. 앞선 설계에 대하여 DTO및 MapStrategy를 하드코딩해야하는 방식과는 달리 해당 엔티티의 매핑에 필요한 필드정보는 DomainCode 의 constructor가 자동으로 가져오며 해당 Field정보로 타입을 조회할 수 있다. 개발자가 추가해야하는 것은 DB에 저장된 DynamicMappingSchema 의 추가된 도메인의 내, 외부 컬럼 정보 일부다.
 
 최종적으로는 해당 인터페이스를 어떠한 외부API의 DTO타입과 무관하게 제공하는게 목표이므로 다음과같이 만들 수 있다. 

 ![설계4](/img/Column-oriented%20JSON%20to%20POJO%20ver4-UniverseDomainMapper_ver_4.png)
 
리플렉션을 사용함에 따라 여러 장단점이 생긴다. 가장 큰 단점은 성능이다. 클래스 분석를 줄이기 위해 정적Field리스트를 로딩시키고 빈번한 db 조회인 Schema조회도 같은 domainCode라면 캐싱된 것을 사용하게끔 바꾼다면 성능을 향상시킬 수 있을 것이다.
 본 프로젝트의 요구사항에서 하루에 입력되는 데이터가 1만건 이내이며 그것도 몇번에 나누어 입력 되므로 성능적인 부담은 적었다.
 ### 4

 이전에서 발견된 취약점이 무심하게 설계적인 문제가 드러났다. 매핑을 위한 map 정보는 외부에서 관리하고 싶었다. 

1. 매핑정보를 제공받아 엔티티를 생성하는 인터페이스
2. 맵핑정보를 제공하는 인터페이스

특정 edc 타입에 따라 다른 설정을 갖고 있는다.
데이터를 받는다. 컬럼과 데이터를 준다. 데이터 타입을 준다.
json 데이터를 목적 칼럼, 밸류 단위로 만든다.
하나의 단위를 받고 엔티티의 종류대로 분류한다.
각 분류대로 각자 엔티티를 생성한다.
엔티티의 연관관계를 맺는다.
