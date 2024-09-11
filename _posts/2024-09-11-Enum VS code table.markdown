---
layout: post
title:  "Enum vs Code Table "
date:   2024-09-11 00:00:00 +0900
categories: 
---

임상시험대상자는 시험에 대한 여러 검사를 받게 된다. 검사 결과에 대해서는 CDISK SDTM에서 정하는 기준을 주로 표준처럼 사용한다. 표준이라는 것은 개념을 용어로 묶어두고 정리하는 경우가 많다. 예를 들어 Alpha-1 Acid Glycoprotein 검사는 A1AGLP 라는 코드를 가진다. 검사의 종류란 상당히 많아서 많으면 3천개 정도 되기도 한다. 

 나는 문뜩 회사에서 일을 하면서 이렇게 많은 코드 정보를 Enum으로 하는게 좋을지 아니면 DB의 코드 테이블로 두는 것이 좋을지 고민하게 되었다.
 
처음에는 메모리 걱정을 했다. 이렇게 많은 enum 상수를 하나의 클래스에 정의하면 그만큼 메소드영역, 힙영역에서 차지하는 메모리가 클 것으로 예상했다. 하지만 얼마전 처리하던 약 3만개 정도의 json 데이터세트 객체가 2메가 정도였던 것을 생각해보면 그런 걱정은 굳이 할 필요가 없겠다고 생각했다.

 Enum.valueOf() 메소드를 사용했을 때 최대 시간복잡도가 O(n)에 해당될 수 있어서 고민했지만 해쉬맵을 사용한 메소드를 구현하면 간단히 O(1)정도로 줄일 수 있다. 
 
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

굳이 단위같은 복잡한 것을 이렇게 enum으로 해야하나 싶지만 이 방법의 진가는 enum 자체가 하나의 클래스로서 기능하기 때문에 단위를 환산하는 등의 수학적 작업에 용이하다는 점이다.



















