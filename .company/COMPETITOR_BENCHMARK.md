# Competitor & Global Tooling Benchmark

> **임베디드 메모리 맵 및 플래시 관리 도구 심층 비교 분석**

---

## 1. Global Tool Comparison Matrix

| 기능 항목 | Keil MDK (Scatter Editor) | STM32CubeIDE / MX | Segger Embedded Studio | 기존 수작업 (Excel / 수동 계산) | **TLiFlashManager (Our Product)** |
|---|---|---|---|---|---|
| **TCON 디스플레이 특화** | ❌ (범용 MCU) | ❌ (STM32 전용) | ❌ (범용) | ⚠️ (사람이 수동 입력) | **✅ (Gamma, DeMura, OD, Config 내장)** |
| **인터랙티브 비주얼 메모리 바** | ⚠️ (단순 텍스트/트리) | ⚠️ (기본 메모리 그래프) | ⚠️ (빌드 후 단순 바) | ❌ (수동 셀 색칠) | **✅ (초고밀도 줌/인터랙티브 캔버스)** |
| **4KB 섹터 그리드 히트맵** | ❌ | ❌ | ❌ | ❌ | **✅ (4KB Erase 섹터별 상태 시각화)** |
| **실시간 주소 충돌 감지** | ⚠️ (컴파일/링크 에러 시만) | ⚠️ (설정 시) | ⚠️ (링크 타임) | ❌ (오류 빈발) | **✅ (입력 즉시 실시간 붉은색 경고)** |
| **C 헤더 + Linker 자동 동기화** | ❌ (별도 수작업) | ⚠️ (C 코드만) | ❌ | ❌ (매크로 수기 작성) | **✅ (C Header + GCC + Keil 동시 생성)** |
| **바이너리 머지 & 0xFF 패딩** | ❌ (srec_cat 등 CLI 필요)| ❌ (외장 툴 필요) | ❌ (CLI 외장 툴) | ❌ (HEX 에디터 수작업) | **✅ (원클릭 브라우저 내 BIN 통합 & CRC)** |
| **설치 불필요 (Web/Electron)** | ❌ (수 GB 설치) | ❌ (수 GB 설치) | ❌ (설치형) | ✅ | **✅ (웹 즉시 실행 + 로컬 보안)** |

---

## 2. Our Strategic Competitive Moat (핵심 차별화 우위)
1. **TCON Domain Focus**: 디스플레이 보정 데이터(De-Mura, Gamma, OD)의 특성을 정확히 이해하고 지원하는 유일한 도구.
2. **Zero-CLI Binary Workflow**: 별도의 `srec_cat`이나 파이썬 스크립트 설치 없이 브라우저에서 드래그 앤 드롭으로 바이너리 병합 및 CRC 계산 완료.
3. **Hardware Safety Guardrails**: 4KB 섹터 정렬 위반 및 런타임 쓰기 섹터 침범을 사전에 원천 차단.
