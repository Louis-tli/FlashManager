# Visual QA Workflow

## Purpose
실제 브라우저 화면 캡처를 기반으로 시각적 완성도, 반도체 툴 특유의 고밀도 가독성 및 UI/UX 표준 준수 여부를 확인하는 워크플로우입니다.

## Visual QA Loop
```text
[코드 변경] ➔ [스크린샷 캡처] ➔ [15개 항목 점수 매기기] 
   ➔ [85점 미만 or 결함?] ➔ YES ➔ [CSS/UI 수정] ➔ [재캡처] ➔ [통과]
```

## Checklist
1. **Color Coding Consistency**: 세그먼트 종류(Boot, App, Gamma, De-Mura 등)별 고유 테마 색상이 메모리 바, 트리 목록, 테이블에서 일관되게 적용되었는가?
2. **Hex Alignment & Monospace**: 모든 16진수 주소(`0x00000000`)가 고정폭 폰트로 완벽하게 수직 정렬되는가?
3. **Contrast Ratio**: 짙은 배경과 밝은 텍스트(또는 그 반대)에서 WCAG AA(4.5:1) 이상의 명도 대비를 만족하는가?
4. **Modal & Frame Stability**: 탭 전환(Visual Map ↔ C Header ↔ Linker ↔ Hex Viewer) 시 창 크기가 출렁거리지 않고 견고하게 고정되는가?
5. **Collision Visibility**: 주소 충돌 발생 시 사용자가 한눈에 인지할 수 있도록 명확한 붉은색 해치 패턴/경고 뱃지가 나타나는가?
