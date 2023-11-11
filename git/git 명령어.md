
$ git branch	: 브랜치 확인

$ git branch exp	: 체크아웃하고 exp브랜치로 이동, 폴더의 소스코드나 파일은 exp브랜치버전으로 바뀐다.

$ git log --branches	: 로그에 브랜치 뷰 옵션

$ git log --branches --decorate		: 브랜치가 잘보이게

$ git log --branches --decorate --graph		: 그래픽 옵션

$ git log --branches --decorate --graph --oneline	: 그래프 축약형

$ git diff master..exp		: master 와 exp 브랜치의 차이 확인

$ git merge exp		:현재 브랜치(master)에서 exp를 가져와서 병합시킴

$ git branch -d exp	: exp 브랜치를 삭제시킴

$ git stash --help	: stash핼프

$ git stash		: 체크아웃을 하기 전에 작업 중인 상황을 임시저장함 커밋과정에서 영향을 주지 못함,  1번이상 커밋된 기록이 있는 파일만 올라감

$ git stash apply	: 임시저장시킨 파일을 modified 상태로 전환시킴 ( 커밋가능)

$ git reset --hard HEAD	: 최신의 커밋상태로 돌아감

$ git stash list	: 스태시 리스트를 확인하기

$ git stash drop	: list 안의 스태쉬를 스태쉬 리스트에서 제거함

$ git stash pop		: list 안의 스태쉬를 스태쉬 리스트에서 제거하고 동시에 apply 시킴