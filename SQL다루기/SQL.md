SELECT `A.값` FROM `A` 
WHERE **NOT EXISTS** (SELECT `1` FROM `B` WHERE `A.값` = `B.값`) 

>`A값`을 출력하는데 그게 `B`에도 있는 값이면 출력하지 않는다. 괄호 안의 행이 있으면 `EXISTS`는 `TRUE`를 반환함 여기선 `NOT`으로 부정연산. `WHERE FALSE`가 되면 `A.값`이 나오지 않는 것.