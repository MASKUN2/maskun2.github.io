---
layout: post
title:  "Lombok Builder.Default 와 생성자간의 초기화 버그."
date:   2025-06-13 00:00:00 +0900
categories: 
---
우선 코드를 보겠습니다.

```java


@Data
class God {
    private String name = "GOD";
    private List<String> alias = List.of("Who i am"," all");
}

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
class Human {
    @Builder.Default
    private String name = "human";

    @Builder.Default
    private List<String> alias = List.of("animal","life");
}

@Data
@Builder
@AllArgsConstructor
// @NoArgsConstructor
class Robot {
    @Builder.Default
    private String name = "robot";

    @Builder.Default
    private List<String> alias = List.of("machine","ai");

    public Robot() {}
}

@SpringBootApplication
public class BuilderDefaultInitializationBugApplication {

    public static void main(String[] args) {
        SpringApplication.run(BuilderDefaultInitializationBugApplication.class, args);

        God god = new God();
        System.out.println(god); // God(name=GOD, alias=[Who i am,  all])

        Human builderHuman = Human.builder().build();
        System.out.println(builderHuman); // Human(name=human, alias=[animal, life])

        Human lombokNoArgHuman = new Human();
        System.out.println(lombokNoArgHuman); // Human(name=human, alias=[animal, life])

        Robot builderRobot = Robot.builder().build();
        System.out.println(builderRobot); // Robot(name=robot, alias=[machine, ai])

        Robot robot = new Robot();
        System.out.println(robot); // Robot(name=null, alias=null) // 분명 필드 초기화를 선언했으나 null로 초기화된다!
    }
}
```

## Lombok @Builder.Default 초기화 버그: 현상과 해결책

이 버그는 심지어 2017년부터 보고되었지만 (GitHub Issue #1347: [https://github.com/projectlombok/lombok/issues/1347](https://github.com/projectlombok/lombok/issues/1347)) 2025년 6월 현재까지 해결되지 않고 있죠.

### 문제 현상

Robot builderRobot = Robot.builder().build();로 생성된 객체는 @Builder.Default 값이 잘 적용됩니다.
하지만 Robot robot = new Robot();로 생성된 객체는 name과 alias가 null로 초기화됩니다.

### 버그

@Builder.Default 를 사용할 때 수동으로 만든 생성자를 통해 객체를 만들면 @Builder.Default로 설정된 기본값이 무시되고, 필드는 null로 남게 되는 예측 불가능한 동작이 발생합니다.  
이것이 바로 Lombok의 @Builder.Default 초기화 버그입니다.

### 해결?

이 버그를 피하는 방법은..

1.  Lombok의 @NoArgsConstructor 사용 :
    직접 기본 생성자를 만드는 대신 @NoArgsConstructor 어노테이션을 사용하는 것입니다. 
    단, 이 방법은 기본 생성자 내에 추가적인 비즈니스 로직이나 복잡한 초기화 과정이 필요할 때는 사용할 수 없습니다. 

2.  수동 생성자 내에서 @Builder.Default 값 명시적 초기화:
    만약 생성자에 추가 로직이 필수적이라면, 직접 기본 생성자를 작성하고 @Builder.Default 필드들을 수동으로 초기화해야 합니다.
    이 방법은 보일러 플레이트 코드를 유발합니다. 필드가 많아지면 유지보수도 어려워질 수 있습니다.

---

롬복이 편하긴한데.. 이런 자잘한 버그들이 있네요.

