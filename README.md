# TLiFlashManager (TCON Flash Memory Map Manager)

> **Vision**: ARM Cortex-M0 기반 Timing Controller(TCON) 반도체 칩을 위한 업계 최고 수준의 직관적이고 무결한 Flash Memory Map 엔지니어링 & 바이너리 관리 소프트웨어 플랫폼.

---

## 🎯 Repository Purpose
본 저장소는 디스플레이(OLED/LCD)용 ARM Cortex-M0 TCON 칩의 복잡한 Flash Memory Map(Bootloader, Main FW, LUT, De-Mura, Gamma, Overdrive, Register Config, Parameter Sector 등)을 시각화, 편집, 유효성 검증(Collision/Alignment Detection), 바이너리 패킹/언패킹 및 C 헤더/린커 스크립트를 자동 생성하는 **TLiFlashManager**의 전략, 아키텍처, 엔지니어링 하네스 및 프로덕션 코드를 관리하는 단일 진실 공급원(Single Source of Truth)입니다.

---

## 📁 Repository Structure
```text
├── .company/                 # TLiFlashManager 회사 조직 기반, 미션, 전략 및 11대 부서
│   ├── MISSION.md            # 비전, 노스스타 메트릭, 핵심 가치
│   ├── STRATEGY.md           # 반도체 툴 비즈니스 모델, 로드맵, 단계별 확장 전략
│   ├── ORGANIZATION.md       # 11대 부서 조직 체계도 & R&R
│   ├── ROADMAP_SHORT_LONG.md # 단기/중기/장기 마일스톤
│   ├── COMPETITOR_BENCHMARK.md # 글로벌 툴(Keil, STM32Cube, Segger 등) 벤치마킹
│   ├── CORPORATE_COMMAND_AND_COLLABORATION_SYSTEM.md # 지휘 및 협업 체계
│   └── departments/          # 11대 핵심 부서별 헌장 (CEO, Strategy, Firmware, QA 등)
├── .agents/                  # 자율 AI 에이전트 시스템 및 하네스 엔지니어링 룰
│   ├── AGENT_ECOSYSTEM.md    # 멀티 에이전트 R&R 및 오케스트레이션
│   ├── rules/                # 글로벌 품질, 아키텍처, 코딩, 반도체 안전, 테스팅, UI/UX 룰
│   └── workflows/            # 기능 개발, 브라우저 QA, 크리틱, 바이너리 검증 워크플로우
├── agents/                   # 6대 핵심 에이전트 페르소나 정의 (Architect, Dev, QA, Critic 등)
├── .ideas/                   # 아이디어 백로그 및 우선순위 매트릭스 (A/B/C/D)
│   └── FUTURE_IDEAS.md       # 기능 백로그 분류표
├── docs/                     # 시스템 아키텍처, DoD, 제품 스펙, ADR 의사결정 기록
│   ├── ARCHITECTURE.md       # 시스템 구조도 및 데이터 파이프라인
│   ├── DEFINITION_OF_DONE.md # 9단계 무결점 완료 기준
│   ├── PRODUCT_SPEC.md       # TLiFlashManager 기능 요구 명세서
│   ├── DECISIONS.md          # 아키텍처 결정 기록(ADR)
│   └── FLASH_MEMORY_MAP_SPEC.md # TCON Cortex-M0 플래시 메모리 규격서
├── tasks/                    # 스프린트 태스크 관리 (active, completed, failed)
├── qa/                       # 품질 보증 리포트, 스크린샷, 테스트 플랜
├── ORGANIZATION.md           # 11대 부서 조직 요약 및 거버넌스 블루프린트
├── STRATEGY_ANALYSIS.md      # TCON Flash Manager 15대 전략 심층 분석서
└── README.md                 # 프로젝트 진입 문서 (본 파일)
```

---

## ⚡ Core Philosophy
**"반도체 펌웨어와 메모리 맵은 1비트의 오류나 주소 오버랩도 허용되지 않는다. 시각적 직관성과 100% 수학적/물리적 무결성을 동시에 달성한다."**

1. **Zero Overlap & Alignment Guarantee**: 4KB Sector / 64KB Block 정렬 및 주소 충돌 원천 차단
2. **Seamless Dual-Target Generation**: C 헤더(`tcon_flash_map.h`), Linker Script(`.ld`, `.sct`), Raw Binary(`.bin`, `.hex`) 완벽 동기화
3. **Semiconductor Production-Grade UX**: 복잡한 헥사(Hex) 주소와 테이블 구성을 한눈에 파악하는 고밀도 시각화 인터페이스
