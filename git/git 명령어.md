$ git config user.name 	:현재 로컬에서의 유저네임을 확인

$ git config user.email 	:현재 로컬에서의 이메일을 확인

$ git init local 	: 로컬이라는 이름의 깃 저장소(폴더)를 만듬

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

$ git init --bare	: 벌거벗은 (저장소)로서의 역할의 깃폴더를 생성함 (내부에 remote라는 폴더가 생김)

$ git remote add 경로	: 경로에 깃리모트 저장소에 추가

$ git remote add origin 경로	: 경로를 오리진이라는 별칭으로 지정


$ ^C :		 ETX (End of text, sends a kill signal), ASCII 0x03

$ pwd		: 현재 디렉토리 경로를 확인

$ git romote -v		: 리모트 경로에 대한 정보를 확인

$ git config --global push.default simple	: 심플방식으로 푸쉬 환경설정을 변경

$  git push origin master		: 원격저장소의별칭(origin)의 브랜치(master)로 푸시하겠다는 의미

$  git push --set -upstream origin master		: 위 연결을 기본값으로 설정하겠다는 의미(푸시만 하면 여기로 간다)

$ git clone 원격저장소주소 (https:...) gitsrc	: 주소의 깃원격저장소를 클로닝하여 현재 위치 폴더에서 gitsrc라는 폴더를 만들고 그곳에 로컬저장소를 만듬

$ git log --reverse	:거꾸로 로그보기

$ git checkout 커밋해쉬주소	: 해당 커밋주소로 돌아가서 둘러보기(해드는 이전과 같음)

$ git remote add orgin 원격저장소주소 (https:...)		:현재 로컬 프로젝트를 연결한 리모트 리파지토리 origin이란 이름의(주소)를 만들겠다는 뜻

$ git remote remove origin 현재 로컬에 연결된 리모트 리파지토리를 지우겠다는 뜻

$ git push -u origin master	: -u는 나중에 push하면 자동으로 연결되게끔함

$ git commit --amend	: 방금 커밋한 내용을 바꿈

$ git pull	:

$ ssh-keygen	: 엔터를 여러번 치면됨 SSH통해서 다른 컴퓨터로 접속할 수 있는 통로가 생김 중간에 표시한 경로에서 id_rsa(개인키), id_rsa.pub(공개키) 파일들이 생김

$ cd ~/.ssh	: 홈 경로의 ssh폴더로 이동

