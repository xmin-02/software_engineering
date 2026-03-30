<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# docs

## Purpose
프로젝트 설계, 기능 요구사항, API 명세, Git 워크플로우 등 시스템 전체의 문서와 스펙을 관리하는 디렉토리. 팀원 간 이해를 맞추고, 기술 결정 배경을 기록하며, API 클라이언트가 참조할 수 있도록 한다.

## Key Files
| File | Description |
|------|-------------|
| design.md | 아키텍처 개요 (DDD 레이어), 시퀀스 다이어그램(크롤링→분석→대시보드), 클래스 다이어그램, 기술 의사결정 (FastAPI, PostgreSQL, KcELECTRA, Qwen2.5-14B 등) |
| requirements.md | 기능 요구사항(FR) 및 비기능 요구사항(NFR): 데이터 수집(여론, 맛집, 공모전, 채용), 감성 분석, 토픽 모델링, 주간 요약, NLP 태깅, 대시보드, 연령별 탭, 파이프라인 관리 등 |
| api-spec.yaml | OpenAPI/Swagger 형식의 REST API 명세 (엔드포인트, 요청/응답 스키마, 인증 방식) |
| WORKFLOW.md | Git 브랜치 전략 (main/dev), 팀원 작업 플로우, 커밋 메시지 규칙, 주의사항(.env 미커밋 등) |

## Subdirectories (if any)
None.

## For AI Agents

### Working In This Directory
- **설계 문서 갱신**: 아키텍처 변경(새 모듈 추가, 레이어 리팩토링) 또는 새로운 기능 추가 시 design.md의 클래스 다이어그램, 시퀀스 다이어그램을 수정합니다.
- **요구사항 정의**: 새로운 기능 요청 시 requirements.md에 FR/NFR 항목을 추가하고, 우선순위를 명시합니다.
- **API 문서 관리**: backend의 엔드포인트 변경 시 api-spec.yaml을 동기화하여 클라이언트 팀과의 혼동을 방지합니다.
- **팀 정책 유지**: Git 워크플로우, 커밋 메시지, 보안(API 키 미커밋) 정책을 WORKFLOW.md에서 일관되게 적용합니다.

### Testing Requirements
문서 변경 후 다음을 확인합니다:
- **설계 정합성**: design.md의 구조 설명이 실제 코드 레이아웃(crawler/, analyzer/, backend/, frontend/)과 일치하는지 검증
- **API 스펙 검증**: api-spec.yaml의 엔드포인트가 backend/routes/의 실제 구현과 일치하는지 확인 (요청/응답 필드명, HTTP 메서드)
- **요구사항 추적성**: requirements.md의 FR/NFR이 실제 구현된 기능과 매핑되는지 확인

## Dependencies

### Internal
- backend/ (main.py, routes/): API 엔드포인트 정의, OpenAPI 문서 자동 생성 (FastAPI)
- crawler/ 모듈: 데이터 수집 기능 (requirements의 FR-01~03 구현)
- analyzer/ 모듈: AI 분석 기능 (requirements의 FR-04~07 구현)
- frontend/ (React): 대시보드 UI 구현 (requirements의 FR-08~09 구현)

### External
- Git 워크플로우: WORKFLOW.md의 규칙을 모든 팀원이 따름
- OpenAPI 스펙: api-spec.yaml을 클라이언트 팀(예: 모바일 앱)과 공유

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
