# 천안 인사이트 (Cheonan Insight)

천안 지역 온라인 게시글, 장소 리뷰, 행사 및 생활 정보를 수집하고 AI 분석 결과를 시각화하는 지역 맞춤형 웹 대시보드입니다. 사용자는 천안의 여론 흐름, 감성 분포, 주요 토픽, 맛집/카페, 관광, 접근성, 외국인 생활, 1인 가구 정보를 한 화면 구조 안에서 탐색할 수 있습니다.

> 소프트웨어공학 수업 프로젝트<br>
> README updated: 2026-06-17

## 현재 배포 상태

| 항목 | 주소/내용 |
| --- | --- |
| 서비스 대시보드 | https://ch.xmin.io/ |
| 운영 API | https://cheonan-api.xmincloud.com |
| 프론트엔드 호스팅 | Cloudflare Pages (`software-engineering`) |
| 운영 API 레이어 | Cloudflare Workers (`cheonan-api`) + D1 |
| 로컬/분석 백엔드 | FastAPI + PostgreSQL |

운영 배포용 프론트엔드 빌드는 반드시 운영 API 주소를 지정해야 합니다.

```bash
cd frontend
VITE_API_URL=https://cheonan-api.xmincloud.com npm run build
```

## 프로젝트 목표

천안 관련 정보는 블로그, 커뮤니티, 지도 서비스, 지자체 공지, 행사 안내, 생활 지원 페이지 등 여러 채널에 흩어져 있습니다. 이 프로젝트는 흩어진 데이터를 수집하고 감성 분석, 토픽 모델링, 키워드 추출을 적용하여 사용자가 지역 여론과 생활 정보를 직관적으로 확인할 수 있는 대시보드를 만드는 것을 목표로 합니다.

특히 단순한 게시글 검색이 아니라 다음 질문에 답할 수 있는 서비스를 지향합니다.

- 천안에서 최근 어떤 주제가 자주 언급되는가?
- 지역 반응은 긍정, 부정, 중립 중 어디에 가까운가?
- 맛집, 카페, 관광, 생활 지원 정보를 목적별로 빠르게 찾을 수 있는가?
- 외국인, 교통약자, 1인 가구처럼 정보 요구가 뚜렷한 사용자에게 필요한 내용을 따로 제공할 수 있는가?

## 주요 기능

### 1. 메인 대시보드

- 전체 게시글 수, 긍정 비율, 음식점 데이터 수, 행사 데이터 수 요약
- 일별 감성 트렌드 및 감성 분포 차트
- 주간 토픽, 주요 키워드, 최근 게시글, 소스별 감성 비교
- 시연 데이터 기준 주요 지표: 게시글 6,231건, 긍정 비율 72%, 음식점 57곳, 행사 50곳

### 2. 장소 및 행사 탐색

- `맛집 · 카페`: 카테고리 필터, 평점순/거리순/리뷰순 정렬, 매장명 검색, 장소 카드
- `관광`: 천안 명소와 행사 정보를 이미지 카드로 제공
- 실제 이미지가 없을 때도 안정적으로 보이는 로컬 fallback 자산 제공

### 3. 생활 유형별 정보

- `청년`, `대학교`, `일자리`, `가족` 탭
- `접근성 정보`: 휠체어 접근, 장애인 화장실, 저상버스, 콜택시 등
- `고등학생`, `의료/약국`, `외국인 생활`, `1인 가구` 탭
- 검색, 언어 선택, 글자 크기, 즐겨찾기, 알림, 위젯 등 상단 보조 기능

### 4. 데이터 분석 파이프라인

- 지역 게시글 및 리뷰 수집
- KcELECTRA 기반 감성 분석
- BERTopic + Korean SBERT 기반 토픽 모델링
- KeyBERT 기반 키워드 추출
- Qwen2.5 기반 요약 생성

모든 AI 분석 모델은 로컬 실행을 기준으로 설계되어 있으며, 외부 AI API에 분석 데이터를 전송하지 않습니다.

## 데이터 소스

| 영역 | 소스 | 수집 방식 |
| --- | --- | --- |
| 지역 여론 | Naver Blog | Naver Search API |
| 지역 여론 | DCInside 천안 갤러리 | BeautifulSoup |
| 공식/생활 정보 | 천안시청 및 공공 데이터 | BeautifulSoup / 공공 API |
| 장소 리뷰 | Naver Place | Selenium |
| 장소 리뷰 | KakaoMap | Selenium |
| 운영 데모 데이터 | Cloudflare D1 seed data | Workers API |

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | React, Vite, Recharts, lucide-react |
| Backend | FastAPI, SQLAlchemy |
| Edge API | Cloudflare Workers, Hono, Cloudflare D1 |
| Database | PostgreSQL 16, Cloudflare D1 |
| Crawling | Selenium, BeautifulSoup, Naver Search API |
| NLP / AI | KcELECTRA, BERTopic, KeyBERT, ko-sbert, Ollama(Qwen2.5) |
| Hosting | Cloudflare Pages, Cloudflare Workers, Cloudflare Tunnel |
| Test | pytest, Vitest, ESLint |

## 아키텍처

```text
[Crawler Modules]
 ├─ opinion: blog/community/city data
 ├─ places: restaurant/cafe reviews
 ├─ events/youth/jobs/college/family
 └─ life info
        │
        ▼
[PostgreSQL / Seed Data]
        │
        ▼
[Analysis Pipeline]
 ├─ sentiment analysis
 ├─ topic modeling
 ├─ keyword extraction
 └─ summary generation
        │
        ├───────────────┐
        ▼               ▼
[FastAPI Backend]   [Cloudflare Workers API + D1]
        │               │
        └───────┬───────┘
                ▼
      [React Dashboard on Cloudflare Pages]
                ▼
         https://ch.xmin.io/
```

## 프로젝트 구조

```text
software_engineering/
├── analyzer/       # 감성 분석, 토픽 모델링, 키워드 추출, 요약 파이프라인
├── backend/        # FastAPI 백엔드, 라우터, 서비스, 스키마, 모델
├── crawler/        # 여론, 장소, 채용, 이벤트, 대학, 생활 정보 크롤러
├── db/             # PostgreSQL 초기화 SQL
├── docs/           # 요구사항, 설계, API 스펙, 워크플로 문서
├── frontend/       # React + Vite 대시보드
├── scripts/        # 데이터 생성 및 운영 유틸리티
├── tests/          # pytest 기반 테스트
└── workers-api/    # Cloudflare Workers + Hono + D1 운영 API
```

## 로컬 실행

### 1. 사전 요구사항

- Python 3.11+
- Node.js 20+
- Docker / Docker Compose
- PostgreSQL 16 또는 `docker-compose.yml`
- Ollama

### 2. 저장소 준비

```bash
git clone https://github.com/xmin-02/software_engineering.git
cd software_engineering
```

### 3. 데이터베이스 실행

```bash
docker compose up -d db
```

기본값은 다음과 같습니다.

| 항목 | 값 |
| --- | --- |
| DB | `cheonan_sentiment` |
| User | `postgres` |
| Password | `postgres` |
| Port | `5432` |

### 4. Python 백엔드 준비

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

개발 중 스케줄러 자동 실행이 필요 없으면 `DISABLE_SCHEDULER=1`을 지정합니다.

```bash
DISABLE_SCHEDULER=1 uvicorn backend.main:app --reload
```

### 5. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

로컬 API를 사용할 때는 `frontend/.env`에 다음 값을 둘 수 있습니다.

```env
VITE_API_URL=http://127.0.0.1:8000
```

### 6. Workers API 실행

```bash
cd workers-api
npm install
npm run dev
```

배포는 Cloudflare 계정과 Wrangler 인증이 필요합니다.

```bash
npm run deploy
```

## 분석 파이프라인 실행

환경변수와 외부 API 키가 준비된 뒤 크롤러와 분석 파이프라인을 실행합니다.

```bash
python -m crawler.run
python run_pipeline.py
```

요약 모델은 Ollama에 사전 다운로드되어 있어야 합니다.

```bash
ollama pull qwen2.5:14b-instruct-q4_K_M
```

## 검증

```bash
# Python tests
pytest

# Frontend lint/build
cd frontend
npm run lint
npm run build

# Workers API tests
cd workers-api
npm test
```

운영 배포용 프론트엔드 검증:

```bash
cd frontend
VITE_API_URL=https://cheonan-api.xmincloud.com npm run build
```

## 문서

| 문서 | 내용 |
| --- | --- |
| `docs/requirements.md` | 기능/비기능 요구사항 |
| `docs/design.md` | 아키텍처 및 설계 |
| `docs/api-spec.yaml` | API 스펙 |
| `docs/WORKFLOW.md` | Git 브랜치 전략 및 협업 규칙 |

## Git 작업 규칙

| 브랜치 | 용도 |
| --- | --- |
| `main` | 안정 버전, 직접 push 금지 |
| `dev` | 개발 통합 브랜치 |

커밋 메시지는 영어로 작성하고, 변경 이유가 드러나도록 작성합니다.

## 개인정보 및 데이터 원칙

- 실명, 전화번호, 상세 주소 등 개인정보 수집을 금지합니다.
- 사용자 식별이 필요한 경우 닉네임 수준의 비식별 정보만 사용합니다.
- AI 분석은 로컬 모델 실행을 기본으로 하며, 외부 AI API에 원문 데이터를 전송하지 않습니다.

## 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.
