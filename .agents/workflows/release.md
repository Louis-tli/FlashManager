# Release Workflow

## Purpose
Definition of Done(DoD)의 모든 게이트를 통과한 결과물을 안전하게 커밋하고 릴리즈하는 절차입니다.

## Steps
1. **Pre-Release Checklist**: `docs/DEFINITION_OF_DONE.md`의 9대 항목 전체 체크 완료
2. **Clean Artifacts**: 디버깅용 임시 로그, 미사용 파일, 불필요한 콘솔 출력 정리
3. **Changelog & Documentation**: 신규 기능 및 변경 사항을 `README.md` 및 `docs/DECISIONS.md`에 업데이트
4. **Git Inspection**: `git status` 및 `git diff` 확인 후 의미 있는 커밋 메시지로 커밋
