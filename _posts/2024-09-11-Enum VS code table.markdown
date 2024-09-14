---
layout: post
title:  "Enum vs Code Table, enum 활용하기"
date:   2024-09-11 00:00:00 +0900
categories: 
---

임상시험대상자는 시험에 대한 여러 검사를 받게 된다. 검사 결과에 대해서는 CDISK SDTM에서 정하는 기준을 주로 표준처럼 사용한다. 표준이라는 것은 개념을 용어로 묶어두고 정리하는 경우가 많다. 예를 들어 Alpha-1 Acid Glycoprotein 검사는 A1AGLP 라는 코드를 가진다. 검사의 종류란 상당히 많아서 많으면 3천개 정도 되기도 한다. 

 나는 문뜩 회사에서 일을 하면서 이렇게 많은 코드 정보를 Enum으로 하는게 좋을지 아니면 DB의 코드 테이블로 두는 것이 좋을지 고민하게 되었다.
 
### 힙 메모리
처음에는 메모리 걱정을 했다. 이렇게 많은 enum 상수를 하나의 클래스에 정의하면 그만큼 메소드영역, 힙영역에서 차지하는 메모리가 클 것으로 예상했다. 하지만 얼마전 처리하던 약 3만개 정도의 json 데이터세트 객체가 2메가 정도였던 것을 생각해보면 그런 걱정은 굳이 할 필요가 없겠다고 생각했다.

### 시간복잡도
 코드테이블은 자체적인 인덱스로 속도가 빠르지만 통상적으로 통신을 요구하는 코드테이블이 느린 것이 보통이다. enum 사용시 Enum.valueOf() 메소드를 사용했을 때 최대 시간복잡도가 O(n)에 해당될 수 있어서 고민했지만 해쉬맵을 사용한 메소드를 구현하면 간단히 O(1)정도로 줄일 수 있다.
 
```java
// 해쉬맵으로 구현하는 조회 메소드
enum Color {
    RED("Red Color"),
    GREEN("Green Color"),
    BLUE("Blue Color");

    private String description;
    
    // 해시맵을 저장할 정적 변수
    private static final Map<String, Color> map = new HashMap<>();

    // 정적 블록에서 해시맵 초기화
    static {
        for (Color color : Color.values()) {
            map.put(color.name(), color); // 이름을 키로, Color를 값으로
        }
    }

    // 해시맵에서 값을 가져오는 메서드
    public static Color getByName(String name) {
        return map.get(name); // 해시맵에서 O(1)로 검색
    }
}

```
그러나 jpa의 기본 구현은 enum.valueOf()를 사용하기 때문에 여전히 jpa로 조회를 수행해도 O(n)의 시간복잡도를 가진다. 대부분의 경우 불필요하지만 enum상수가 방대한 경우에는 @Converter(autoApply = true)을 선언한 AttributeConverter을 구현함으로써 jpa 하이버네이트의 enum 매핑에서의 시간복잡도를 줄일 수 있다. 


### enum 네이밍 규칙과 협상하기
enum 상수는 네이밍 규칙을 가진다. 따라서 숫자로 시작하거나 특수문자가 포함된 경우는 어떻게 해야할지 고민했다. 실제로 v/v%과 같은 것을 네이밍할 수 있을까 고민이 들었다. 간단한 방법으로 숫자로 시작하는 경우는 _로 시작시키고 /는 PER로, %는 PERCENT로 치환하는 것이다. 치환하기 전의 문자를 필드로서 가지게 하면 된다.

```java
// 특수문자를 대체하기
enum Unit {
    VOLUME_PER_VOLUME_PERCENT('v/v%'),
    _1_PER_100_MM('1/100mm')
    ;
    //생성자 메소드 생략.. 약 500개
}

```

굳이 단위같은 복잡한 것을 이렇게 enum으로 해야하나 싶지만 이 방법의 진가는 enum 자체가 하나의 클래스로서 기능하기 때문에 단위를 환산하는 등의 수학적 작업에 용이하다는 점이다. 그리고 다양한 도메인 로직을 넣어둘 수 있다.

다만 지나치게 긴 문자열, 복잡한 특수문자가 들어있는 코드는 이 방법도 한계가 분명하다. 예를 들어 짧은 유니크 코드가 존재하지 않고 " Dehydrated acoscobic acid, vitamin C* isotopic acid&*@ " 등으로 긴 경우는 오히려 특수문자를 치환하여 enum으로 하면 더 가독성이 떨어진다. 이런 경우 특별히 도메인 로직이 요구되지 않는다면 코드 테이블로 pk로 연관관계를 맺게하는게 효율적이다.

### 변경가능성
또한 우려되는 상황은 코드변경이 필요한 경우다.
만약 우리가 코드 테이블로 이를 관리하고 각 코드 마다의 pk를 따로 관리한다면 변경을 해야할 곳은 최소한 DB 벌크 업데이트에 그칠 것이다.
만약 a,b,c라는 enum코드를 사용하고 있다고 가정하자. 한동안 모든 코드를 JPA의 @Enumurated(Type = String)으로 상수의 .name을 저장하여 DB의 모든 정보가 a,b,c로 저장된 상황에서 코드를 A,B,C로 변경해야한다고 한다면 곧바로 DB와 애플리케이션 간의 불일치 문제가 발생한다. 이 상황에서 선택할 수 있는 방법이 다음과 같다.
* 변경된 Enum 정의에 따른 DB의 벌크 업데이트
  * 스프링 기동시 자동 수행 SQL스크립트를 구성하면 코드 변경 시점과 DB변경시점의 간극을 최소화할 수 있다. 단, 누락 스크립트로 인한 불일치 위험은 상존한다.
* 애플리케이션에서 enum attribute convertor을 수정, 재정의하여 DB의 a,b,c가 enum A,B,C로 매핑되도록 우회
  * 코드레벨에서만 의존성을 가진다. 단 협업시 컨택스트를 모르는 convertor의 재정의 누락에 의한 문제가 생길 수 있다.
* 추가적으로 enum attribute convertor를 재정의해두고 matching 실패시 사전에 정의해둔 default 상수 (ex. UNMATCHED) 등으로 헨들링하는 방법
  * 문제을 우선 우회하여 시스템은 당장 가동될 수 있지만 기존 유즈케이스가 조회 만 수행하는 것이나 enum 상수 조건에 따른 도메인 로직이 존재한다면 시스템 장애로 이어질 수 있다. 
여러가지 상황에 따라 다르지만 테스트만 잘 된다면 첫번째 DB스크립트로만으로도 이를 극복할 수 있다.

### enum클래스 내부의 순환참조 문제 해결하기
enum에 도메인 로직을 넣게될 때 다른 enum을 참조해야하는 경우가 생긴다. 다른 enum 클래스에 정의된 것을 참조하는 것이면 문제가 없지만 enum 클래스 내부에서 참조하는 경우 순환참조 문제가 발생한다. 
예를 들어서 다음의 코드는 컴파일되지 못한다.
```java

enum 직급{
    부장(직급.과장), //Cannot refer to enum constant '과장' before its definition
    과장(직급.대리),
    대리(직급.사원),
    사원(null);
  
  private final 직급 아래직급;
}
```
이것을 해결하기 위해서는 몇가지 방법이 있다.
- supplier 를 활용
  - 단 순서의 제약을 받음
```java
enum 직급{
    사원(()-> null),
    대리(()-> 직급.사원),//사원 정의 후 참조가능
    과장(()->직급.대리),
    부장(()-> 직급.과장), 
    ;

    private final Supplier<직급> 아래직급;
}

```

- 정적 블록 사용
  - 순서에 지장을 받지 않음 단 분리됨
```java
enum 직급{
    부장, 
    과장,
    대리,
    사원;

    private 직급 아래직급; // 나중에 부여하므로 final은 제거해야함

    static {
        부장.아래직급 = 과장;
        과장.아래직급 = 대리;
        대리.아래직급 = 사원;
        사원.아래직급 = null;
    }
}
```
정정블록은 일반적으로 클래스의 로드시점에서 호출되어 생성자를 선행하지만 enum 클래스의 경우는 상수선언을 먼저 수행하므로 enum객체 생성시점 이후로 초기화가 가능하다.

### 외부소스로 대량의 enum을 코드를 작성해야하는 경우
몇개의 도메인 상수를 다루는 경우는 개발자가 직접 타이핑하면된다. 하지만 도메인에서 다루는 상수 카테고리가 100개에 각 상수가 100개라면 1만개의 상수를 타이핑해야한다. 그리고 만약 그게 지속적으로 변경된다면? 그것을 타이핑하고 관리할 사람은 많지 않을 것이다. 수작업의 휴먼에러도 발생하기 쉽다.

기본적으로 클래스라는 것이 텍스트파일의 확장자를 .java로 만든 것이기 때문에 외부소스의 포맷이 일정하다면 이를 자동화할 수 있다.

우선 외부 소스 (html, xlsx) 를 준비하고 이것을 각각 읽어서 .java로 enum 클래스화 시키면된다. 경로는 로컬에서 작업하고 있는 enum 디렉토리로 덮어씌우게 만들면 생성후 이상한게 있으면 컴파일에러를 발생할 것임으로 잘 수행되었는지 확인도 간편하다.

```java
public class EnumGenerator { //챗지피티가 짜준 코드
  public static void main(String[] args) {
    String excelFilePath = "codes.xlsx";  // 엑셀 파일 경로
    String enumFileName = "ColorEnum.java";  // 생성할 .java 파일 이름
    String packageName = "com.example.enums";  // 패키지 이름

    try {
      // 엑셀 파일 읽기
      FileInputStream file = new FileInputStream(new File(excelFilePath));
      Workbook workbook = new XSSFWorkbook(file);
      Sheet sheet = workbook.getSheetAt(0);  // 첫 번째 시트 사용

      // StringBuilder를 사용하여 .java 파일 내용을 생성
      StringBuilder enumContent = new StringBuilder();
      enumContent.append("package ").append(packageName).append(";\n\n");
      enumContent.append("public enum ColorEnum {\n");

      // 첫 번째 행은 헤더이므로 두 번째 행부터 읽기 시작
      for (int i = 1; i <= sheet.getLastRowNum(); i++) {
        Row row = sheet.getRow(i);
        if (row != null) {
          Cell codeCell = row.getCell(0);
          Cell descCell = row.getCell(1);

          if (codeCell != null && descCell != null) {
            String code = codeCell.getStringCellValue();
            String description = descCell.getStringCellValue();

            // Enum 항목 추가
            enumContent.append("    ")
                    .append(code.toUpperCase())
                    .append("(\"")
                    .append(description)
                    .append("\"),\n");
          }
        }
      }

      // 마지막 Enum 항목의 콤마 제거 및 세미콜론 추가
      int lastComma = enumContent.lastIndexOf(",");
      if (lastComma != -1) {
        enumContent.replace(lastComma, lastComma + 1, ";");
      }

      // 생성자 및 필드 추가
      enumContent.append("\n    private final String description;\n\n")
              .append("    ColorEnum(String description) {\n")
              .append("        this.description = description;\n")
              .append("    }\n\n")
              .append("    public String getDescription() {\n")
              .append("        return description;\n")
              .append("    }\n")
              .append("}");

      // 파일로 저장
      Files.write(Paths.get(enumFileName), enumContent.toString().getBytes());

      // 리소스 닫기
      workbook.close();
      file.close();

      System.out.println(enumFileName + " 파일이 생성되었습니다.");
    } catch (Exception e) {
      e.printStackTrace();
    }
  }
}
```

### enum은 결국 클래스
 클래스이기 때문에 enum 이름을 바꾸려면 빌드, 배포를 다시해야한다. 코드 테이블은 db 수정으로 운영중에 대체가 가능하다.


















