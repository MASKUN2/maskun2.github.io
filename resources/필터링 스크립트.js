// 필요한 모듈을 가져옵니다.
const fs = require('fs'); // 파일 시스템 모듈
const path = require('path'); // 경로 관련 모듈

// 입력 파일 경로와 출력 파일 경로를 설정합니다.
const inputFilePath = '우아한테크 유투브 채널.json'; // 원본 JSON 파일 경로
const outputFilePath = '우아한테크 유투브 채널_filter.json'; // 결과를 저장할 JSON 파일 경로

// 파일을 읽고 필터링하는 함수
function filterAndSaveJson(sourcePath, destinationPath, keywordToExclude) {
    // 1. JSON 파일 읽기 (비동기 방식)
    fs.readFile(sourcePath, 'utf8', (err, data) => {
        if (err) {
            console.error("파일을 읽는 중 오류가 발생했습니다:", err);
            return;
        }

        let jsonData;
        try {
            // 2. JSON 파싱
            jsonData = JSON.parse(data);
        } catch (parseError) {
            console.error("JSON 파싱 중 오류가 발생했습니다:", parseError);
            return;
        }

        // jsonData가 배열인지 확인합니다.
        if (!Array.isArray(jsonData)) {
            console.error("JSON 데이터가 배열 형식이 아닙니다.");
            return;
        }

        // 3. 객체 배열 필터링
        // title 속성에 keywordToExclude 문자열이 포함되지 않은 객체만 선택합니다.
        const filteredData = jsonData.filter(obj => {
            // obj.title이 문자열인지, 그리고 존재하는지 확인합니다.
            return typeof obj.title === 'string' && !obj.title.includes(keywordToExclude);
        });

        // 4. 필터링된 데이터를 JSON 문자열로 변환
        // JSON.stringify의 세 번째 인자는 가독성을 위해 들여쓰기 칸 수를 의미합니다.
        const outputJsonData = JSON.stringify(filteredData, null, 2);

        // 5. 새로운 JSON 파일에 저장 (비동기 방식)
        fs.writeFile(destinationPath, outputJsonData, 'utf8', (writeErr) => {
            if (writeErr) {
                console.error("파일을 저장하는 중 오류가 발생했습니다:", writeErr);
                return;
            }
            console.log(`필터링된 데이터가 ${destinationPath} 파일에 성공적으로 저장되었습니다! 🎉`);
        });
    });
}

// 함수 실행
filterAndSaveJson(inputFilePath, outputFilePath, "10분");