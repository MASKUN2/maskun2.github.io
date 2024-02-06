SELECT `A.값` FROM `A` 
WHERE **NOT EXISTS** (SELECT `1` FROM `B` WHERE `A.값` = `B.값`) ; 

>`A값`을 출력하는데 그게 `B`에도 있는 값이면 출력하지 않는다. 괄호 안의 행이 있으면 `EXISTS`는 `TRUE`를 반환함 여기선 `NOT`으로 부정연산. `WHERE FALSE`가 되면 `A.값`이 나오지 않는 것.


SELECT `A.ID` FROM `A` LEFT OUTER JOIN `B`  
ON `A.ID = B.ID` AND `B.VAL = 1` ;
> ON 절에서도 조건을 걸 수 있다. WHERE에 거는 것과 다른 것은 순서차이다. GROUP BY를 쓰는 문법에서는 

START WITH `A.boss` IS NULL  
CONNECT BY PRIOR `A.ID` = `A.Boss`
ORDER SIBLINGS BY `A.이름` DESC;
> 계층형에서 `A.boss` 가 상위식별자이고 `A.ID` 가 현 레코드의 식별자이다. `PRIOR` 가 붙은 쪽이 상위란 뜻으로 PRIOR `A.ID` = `A.Boss` 에서 PRIOR `A.ID` 가 `A.Boss`와 동등하다는 뜻으로 해석된다. 계층이 낮은 방향으로 흘러가므로 PRIOR가 없는 쪽이 먼저 나온다. 시블링즈 끼리의 순서는 이름에 따라 오름차순이다.

| `A.ID`  | `A.boss`    | `A.이름`  |
|:--------|:------------|:--------|
| 1       | NULL        | John    |
| 3       | 1           | Bob     |
| 7       | 3           | Frank   |
| 6       | 3           | Eva     |
| 2       | 1           | Alice   |
| 5       | 2           | Diana   |
| 4       | 2           | Charlie |