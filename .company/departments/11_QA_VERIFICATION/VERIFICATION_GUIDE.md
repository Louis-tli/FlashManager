# QA & Verification Guide: 11_QA_VERIFICATION

## Verification Protocol
1. **Automated Unit Tests**: Vitest/Jest를 활용한 주소 충돌 알고리즘, CRC32 테이블 연산, C 헤더 텍스트 생성 테스트.
2. **Browser Interaction QA**: 실제 브라우저 환경에서 세그먼트 생성, 드래그 수정, 주소 충돌 시 경고 시각화, 바이너리 업로드 테스트.
3. **Binary Round-Trip QA**: 생성된 `full_image.bin`의 CRC32 및 해시 검증.
4. **UI Review (85+ Score Standard)**: 15개 항목 100점 만점 반도체 UI 심사.
