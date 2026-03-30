<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# Cheonan Community Sentiment Analysis Dashboard

## Purpose
천안 지역 온라인 커뮤니티 게시글과 맛집/카페 리뷰를 수집하여 AI 기반 감성 분석을 수행하고, 지역 여론 동향과 장소 추천을 대시보드로 시각화하는 웹 애플리케이션. 소프트웨어공학 수업 프로젝트.

## Key Files

| File | Description |
|------|-------------|
| `requirements.txt` | Python 패키지 의존성 (FastAPI, torch, bertopic 등) |
| `docker-compose.yml` | PostgreSQL 16 컨테이너 설정 |
| `CLAUDE.md` | AI 에이전트 작업 규칙 및 프로젝트 컨벤션 |
| `README.md` | 프로젝트 개요 및 기술 스택 문서 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `analyzer/` | NLP/AI 분석 파이프라인 — 감성분석, 토픽모델링, 키워드추출, 요약 (see `analyzer/AGENTS.md`) |
| `backend/` | FastAPI 백엔드 서버 — API 라우트, 모델, 서비스 (see `backend/AGENTS.md`) |
| `config/` | 외부 API 및 서비스 설정 JSON 파일 (see `config/AGENTS.md`) |
| `crawler/` | 웹 크롤러 모듈 — 여론, 장소, 채용, 이벤트, 대학 (see `crawler/AGENTS.md`) |
| `db/` | 데이터베이스 초기화 SQL (see `db/AGENTS.md`) |
| `docs/` | 설계 문서, API 스펙, 요구사항 (see `docs/AGENTS.md`) |
| `frontend/` | React + Vite 프론트엔드 대시보드 (see `frontend/AGENTS.md`) |
| `scripts/` | 분석 실행, 대시보드 데이터 생성 유틸리티 스크립트 (see `scripts/AGENTS.md`) |
| `tests/` | pytest 기반 테스트 스위트 (see `tests/AGENTS.md`) |
| `workers-api/` | Cloudflare Workers API — 엣지 프록시/캐시 레이어 (see `workers-api/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Python 코드는 PEP 8 + type hints 필수. 코드 주석은 한국어로 최소한만.
- 커밋 메시지는 영어, conventional commit 형식 (`feat:`, `fix:`, `docs:` 등).
- `main` 브랜치는 direct push 금지. `dev` 브랜치에서 작업 후 PR로 머지.
- `.env` 파일에 시크릿 보관. 절대 커밋하지 않음.
- 개인정보(실명, 전화번호, 주소) 수집 금지. 닉네임만 허용.

### Architecture
- DDD 원칙: domain / application / infrastructure / presentation 레이어 분리.
- 각 모듈(크롤러, 분석기, 라우트)은 독립적으로 추가/제거 가능하도록 모듈화.
- 모든 AI 모델은 로컬 실행. 외부 AI API 호출 없음.

### Tech Stack
- Backend: FastAPI (Python) + PostgreSQL + SQLAlchemy
- Frontend: React + Vite + Recharts
- Crawling: BeautifulSoup, Naver/Kakao/Saramin/data.go.kr API
- NLP: KcELECTRA (감성), BERTopic + ko-sbert (토픽), KeyBERT (키워드), Qwen2.5-14B via Ollama (요약)
- Hosting: Cloudflare Pages (프론트엔드) + Cloudflare Tunnel (API)

### Testing Requirements
- `pytest`로 Python 테스트. 각 모듈별 단위 테스트 작성.
- 변경 전 테스트 실행으로 기존 기능 보전 확인.

## Dependencies

### External
- PostgreSQL 16 (Docker)
- Ollama (Qwen2.5-14B-Instruct Q4)
- Naver Search API, Kakao Place API, Saramin API, data.go.kr API, Work24 API
- Cloudflare Workers / Pages / Tunnel

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
