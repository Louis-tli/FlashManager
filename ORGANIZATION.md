# TLiFlashManager Platform Organizational Blueprint & Engineering Harness

> **TCON 반도체 전사 11대 핵심 부서 조직 체계 & AI Engineering Harness R&R (Roles & Responsibilities)**

---

## 🏛️ 부서별 담당 업무 및 에이전트 매핑

```text
├── 01. CEO (최고경영자)              : 전사 반도체 SW 비전, 최종 승인, R&D 자원 배분, 파트너십
├── 02. 전략 (STRATEGY)              : TCON 제품군(OLED/LCD) 플래시 로드맵, 표준화 및 고객사(패널사) 대응 전략
├── 03. 반도체 리서치 (RESEARCH)     : Cortex-M0 아키텍처 분석, NOR Flash SPI/eSPI 스펙 분석, 패널 보정 알고리즘
├── 04. PRODUCT (프로덕트 설계)      : 메모리 맵 비주얼 에디터, LUT/De-Mura 데이터 매퍼, 린커/헤더 제너레이터 기획
│   └── 🏛️ Product Architect         : 기능 분해, 인터페이스 설계, Memory Schema 설계, Implementation Plan 수립
├── 05. 도메인 로직 (DOMAIN LOGIC)   : Sector Alignment(4KB/32KB/64KB), Checksum(CRC32/SHA), Bin Merge/Split 알고리즘
│   └── 🔬 Domain Expert Agent       : Cortex-M0 Vector Table, Remap, Flash XIP, Boot/App/LUT 제약 검증
├── 06. 엔지니어링 (ENGINEERING)     : React/Electron GUI, 바이너리 파서, 메모리 히트맵 시각화, WebAssembly 연산기
│   └── 💻 Developer Agent           : TypeScript Strict Mode 프로덕션 코드 구현 & 빌드/타입 무결성 검증
├── 07. 시스템/인프라 (SYSTEM/INFRA) : CI/CD 자동화, 바이너리 회귀 테스트 러너, 크로스 플랫폼(Windows/Linux) 빌드
├── 08. DECISIONS (의사결정)         : 아키텍처 결정 기록(ADR), 메모리 레이아웃 변경 심의, 하위 호환성 거버넌스
├── 09. TASKS (업무 관리)            : A/B/C/D 우선순위 스프린트 백로그 (tasks/active, completed, failed)
├── 10. SYSTEM HARNESS (거버넌스)    : 에이전트 오케스트레이션, 무결점 규칙 감사, 자가 치유(Self-Healing) 제어
│   └── 🧐 Critical Reviewer         : 주소 충돌, 메모리 오버플로우, 결합도, 성능 병목 냉정 비판
└── 11. 검증 (QA & VERIFICATION)     : 실제 브라우저 E2E 검증, 바이너리 비트 레벨 검증, 회귀 테스트
    ├── 🧪 QA Engineer               : 기능/단위/경계조건(Boundary)/손상 바이너리(Corrupted) 전수 테스트
    └── 🎨 UI/UX Reviewer            : 15개 항목 100점 만점 반도체 전문 엔지니어링 UI/UX 심사 (85점+ 기준)
```

---

## 📖 핵심 하네스 및 거버넌스 문서

- [Definition of Done (DoD)](file:///d:/Project/20260903_TLiFlashManager/docs/DEFINITION_OF_DONE.md)
- [시스템 아키텍처 명세서 (ARCHITECTURE.md)](file:///d:/Project/20260903_TLiFlashManager/docs/ARCHITECTURE.md)
- [제품 기획 명세서 (PRODUCT_SPEC.md)](file:///d:/Project/20260903_TLiFlashManager/docs/PRODUCT_SPEC.md)
- [TCON 플래시 메모리 규격서 (FLASH_MEMORY_MAP_SPEC.md)](file:///d:/Project/20260903_TLiFlashManager/docs/FLASH_MEMORY_MAP_SPEC.md)
- [아키텍처 결정 기록 (DECISIONS.md)](file:///d:/Project/20260903_TLiFlashManager/docs/DECISIONS.md)
- [글로벌 엔지니어링 룰 (.agents/rules/global-quality.md)](file:///d:/Project/20260903_TLiFlashManager/.agents/rules/global-quality.md)
- [반도체 안전 수칙 (.agents/rules/semiconductor-safety.md)](file:///d:/Project/20260903_TLiFlashManager/.agents/rules/semiconductor-safety.md)
- [기능 개발 하네스 워크플로우 (.agents/workflows/feature.md)](file:///d:/Project/20260903_TLiFlashManager/.agents/workflows/feature.md)
