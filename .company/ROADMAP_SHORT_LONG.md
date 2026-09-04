# Short-term & Long-term Engineering Roadmap

## 📅 Short-Term (Sprint 1 ~ 3: MVP Foundation)
- [x] 전사 11대 부서 및 AI 에이전트 하네스 엔지니어링 거버넌스 구축
- [x] 반도체 플래시 메모리 규격서 및 아키텍처 명세서 수립
- [ ] React 19 + TypeScript + Tailwind CSS 기반 초고속 경량 클라이언트 환경 구성
- [ ] Flash Segment 데이터 모델 및 유효성 검증 엔진 (`MemoryMapValidator`) 구현
- [ ] Interactive Visual Memory Bar & 4KB Sector Grid 시각화 컴포넌트 개발
- [ ] Live C Header (`tcon_flash_map.h`) 및 Keil/GCC Linker Script 실시간 생성기 구현
- [ ] Multi-Segment Binary Packer (0xFF Padding) & IEEE 802.3 CRC32 연산 엔진 구현
- [ ] TL2300(1MB), TL2500(2MB) 레퍼런스 칩 프로파일 프리셋 탑재 및 JSON Export/Import

## 📅 Mid-Term (Sprint 4 ~ 6: Advanced Capabilities)
- [ ] 구버전 vs 신버전 메모리 맵 Visual Diff & Migration Helper 개발
- [ ] 인라인 Binary Hex Viewer (세그먼트별 컬러 하이라이트 & 실시간 값 확인)
- [ ] 기존 C 헤더(`.h`) 및 Keil `.sct` / `.map` 파일 Reverse Parsing 기능
- [ ] 디스플레이 전용 2D De-Mura 및 Gamma 2.2/2.4 Table Size Calculator

## 📅 Long-Term (Sprint 7+: Hardware-in-the-Loop & SoC Extension)
- [ ] WebUSB/WebSerial 기반 SWD/JTAG Direct Flash Programmer 모듈 연동
- [ ] Secure Bootloader 암호화 서명 주입 및 eFuse OTP 비트 매핑 지원
- [ ] Cortex-M0+ / M4 듀얼 코어 공유 메모리 및 멀티 뱅크 파티셔닝 지원
