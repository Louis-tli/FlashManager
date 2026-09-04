# Architecture Decision Records (ADR) - TLiFlashManager

## ADR-001: Pure Client-Side SPA & WebAssembly / Web Worker Architecture
- **Status**: Accepted
- **Context**: 반도체 펌웨어 바이너리와 메모리 맵 정보는 회사의 핵심 기밀(IP)이므로 외부 서버로 전송되어서는 안 된다. 또한 오프라인 환경이나 사내 폐쇄망에서도 완벽히 동작해야 한다.
- **Decision**: 모든 메모리 맵 유효성 검사, C 헤더/린커 생성, 바이너리 파싱 및 CRC32 연산은 100% 브라우저 클라이언트 사이드(Client-Side JavaScript / WebAssembly)에서 수행한다.
- **Consequence**: 서버 비용 0원, 강력한 보안성 확보, 지연 시간 없는 즉각적인 반응 속도 달성.

---

## ADR-002: Default 0xFF Padding for Free Memory Space
- **Status**: Accepted
- **Context**: NOR Flash 메모리는 Erase 후 모든 비트가 1(0xFF)로 초기화된다.
- **Decision**: 바이너리 패킹 시 세그먼트 간의 빈 공간(Unallocated Free Space)은 0x00이 아닌 `0xFF`를 기본값으로 채우고, 필요 시 0x00 옵션을 선택할 수 있게 한다.
- **Consequence**: 실제 칩 플래시에 프로그래밍할 때 불필요한 0x00 쓰기를 방지하여 플래시 수명 보호 및 굽기 속도 최적화.

---

## ADR-003: 4KB Sector-Aligned Segment Enforcement for Writable Data
- **Status**: Accepted
- **Context**: 런타임에 쓰기가 발생하는 NVM Parameter, White Balance Calibration 데이터가 읽기 전용 코드(RO Code)와 같은 4KB 섹터에 존재하면, 소거 작업 시 코드가 파괴된다.
- **Decision**: Writable / NVM 속성의 세그먼트는 반드시 4KB 섹터 경계 정렬을 필수로 강제한다.
- **Consequence**: 펌웨어 런타임 안정성 극대화 및 칩 브릭 원천 차단.
