# Architecture Review Workflow

## Purpose
대규모 기능 추가나 메모리 데이터 모델 변경 시, 아키텍처 결합도와 성능, 확장성, 반도체 하드웨어 안전성을 사전에 심층 검토하는 워크플로우입니다.

## Review Steps
1. **Domain Boundary Check**: UI 컴포넌트(`components/`), 도메인 로직/엔진(`domain/`, `services/`), 스키마(`types/`)의 엄격한 관심사 분리 확인
2. **State & Immutability Audit**: 메모리 맵 수정 시 불변 상태 트리 업데이트 및 불필요한 전체 리렌더링 차단 검토
3. **Memory Map Math Safety**: 32비트 Unsigned Integer 주소 오버플로우 방지 및 정렬 로직 검증
4. **Binary Processing Efficiency**: 대용량 바이너리(4MB~16MB) 패킹/언패킹 시 메인 스레드 지연 및 메모리 누수 방지
5. **Cross-Tool Compatibility**: Keil MDK, GCC, IAR 린커 문법과의 100% 호환성 검증
6. **ADR Documentation**: 주요 결정 사항을 `docs/DECISIONS.md`에 기록
