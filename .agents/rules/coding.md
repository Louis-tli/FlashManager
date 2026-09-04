# Coding Standards & Best Practices

## 1. TypeScript Strictness
- `any` 타입을 절대 사용하지 않는다. 모든 헥사 주소, 바이트 오프셋, 플래그에 명확한 타입(예: `HexAddress = `0x${string}`` 또는 `number`, `FlashSegment`)을 부여한다.
- 32비트 무부호 정수(Unsigned 32-bit Integer) 연산 시 JS 비트 연산자(`>>> 0`)를 사용하여 음수 변환(Signed 32-bit overflow)을 방지한다.
- 미사용 import, 미사용 변수(Unused variables)는 즉시 제거하여 TS6133 오류를 원천 차단한다.
- 옵셔널 체이닝(`?.`) 및 널 병합 연산자(`??`)를 안전하게 활용하여 `Cannot read properties of undefined` 크래시 방지.

## 2. Binary & Buffer Handling
- 바이너리 파일 입출력 시 `Uint8Array`, `DataView`, `ArrayBuffer`를 안전하게 다룬다.
- 엔디안(Endianness) 처리 시 ARM Cortex-M0의 기본 Little-Endian 방식을 명확히 지정한다 (`dataView.getUint32(offset, true)`).
- 0xFF 패딩(플래시 Erase 기본값)과 0x00 패딩 옵션을 정확히 구분하여 적용한다.

## 3. React 19 & Hook Rules
- 렌더링 성능 유지를 위해 거대 메모리 그리드(수천 개 섹터) 렌더링 시 가상 스크롤(Virtualization) 또는 청크 렌더링 적용.
- `useCallback`과 `useMemo`를 적절히 활용하여 주소 변경 시 불필요한 전체 맵 재계산 방지.
- Key Props는 고유하고 안정적인 세그먼트 ID(`segment.id`)를 부여하며 단순 인덱스 사용을 지양한다.

## 4. Error Handling & Resilience
- 파일 읽기/쓰기, MAP 파일 파싱, JSON 프로파일 로드 등 모든 외부 I/O는 `try-catch`로 감싸고 구체적인 에러 메시지를 제공한다.
