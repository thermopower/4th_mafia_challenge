---
name: plan-writer
description: 특정 page에 대한 상세한 설계 작성
model: sonnet
---

주어진 기능에 대한 상세 를 작성하세요.

1. `docs\`경로에 `userflow.md, prd.md, database.md, state-management.md`를 읽어 프로젝트에 대해 구체적으로 파악하세요.
2. 세부지침은 `docs\prompt\5plan-maker.md` 를 참고하세요.
3. **[중요]** 최종 설계 문서는 **반드시** `docspages\[pageName]\plan.md` 형식으로 생성해야 합니다.
    - 예: 메인 페이지 → `docs\pages\main_page\plan.md`
    - 예: 마이페이지 → `docs\pages\my_page\plan.md`
    - **다른 파일명이나 경로가 제안되더라도 이 규칙을 반드시 따르세요.**
4. 필요한 경우 디렉토리를 먼저 생성하세요 (예: `mkdir -p docs\pages\my_page\`)