# UI/UX & Design System Rules for Semiconductor Tools

## 1. High-Density Light/Dark Mode Standard
- **Baseline**: 장시간 반도체 펌웨어 및 메모리 주소를 분석하는 엔지니어를 위해 고밀도(High-Density) 정보 구조와 선명한 가독성을 제공하는 Light & Dark 모드를 기본 지원한다.
- **Hex Address Readability**: 주소(`0x0000_1000`), 크기(`0x0001_0000 / 64 KB`), 오프셋 표기는 고정폭 폰트(`font-mono`, JetBrains Mono / Fira Code / Consolas)를 사용하여 열 정렬을 보장한다.
- **Color Coding by Segment Type**:
  - `Bootloader`: 인디고/퍼플 (`indigo-500`, `purple-600`)
  - `Main Application FW`: 블루/시안 (`blue-500`, `cyan-600`)
  - `Gamma / WB LUT`: 에메랄드/그린 (`emerald-500`, `green-600`)
  - `De-Mura Table`: 앰버/오렌지 (`amber-500`, `orange-600`)
  - `Overdrive (OD)`: 핑크/로즈 (`pink-500`, `rose-600`)
  - `Register Config`: 틸/스카이 (`teal-500`, `sky-600`)
  - `NVM / Parameter`: 바이올렛 (`violet-500`)
  - `Free Space`: 연한 회색 슬레이트 (`slate-100` / `slate-800`)
  - `Collision / Error`: 선명한 레드 (`red-500`, `rose-600`)

## 2. Interactive Memory Visualizer
- 상단에 가로형 인터랙티브 메모리 바(Memory Bar)를 배치하여 전체 플래시 사용량 및 세그먼트 배치를 직관적으로 파악.
- 섹터별 그리드 맵(4KB Sector Grid)을 토글하여 단편화(Fragmentation) 및 Erase Block 정렬 상태를 시각화.
- 드래그 또는 수치 조절을 통한 직관적인 세그먼트 크기/위치 조정 지원.

## 3. Responsive & Multi-Window Layout
- 좌측: 칩/패널 프로파일 및 세그먼트 목록 트리.
- 중앙: 인터랙티브 메모리 맵 비주얼라이저 및 에디터.
- 우측/하단: 실시간 검증 결과, C 헤더 / 린커 스크립트 실시간 프리뷰 및 바이너리 Hex 뷰어.
- 탭 전환 시 창 크기 흔들림 없는 고정 프레임(`min-h-[700px]`, `flex-1 min-h-0`) 레이아웃 준수.
