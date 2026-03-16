# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
천안 지역 온라인 커뮤니티 게시글과 맛집/카페 리뷰를 수집하고, AI 기반 감성 분석을 수행하여 지역 여론 동향 및 맛집/카페 추천을 시각화하는 웹 대시보드 시스템.

### 1.2 Scope
- 5개 데이터 소스에서 자동 크롤링
- 로컬 AI 모델 기반 감성 분석, 토픽 모델링, 키워드 추출, 요약
- 웹 대시보드를 통한 분석 결과 시각화
- Cloudflare를 통한 외부 접근 가능 배포

### 1.3 Definitions
| 용어 | 정의 |
|------|------|
| 감성 분석 | 텍스트의 긍정/부정/중립 감정을 분류하는 NLP 작업 |
| 토픽 모델링 | 문서 집합에서 주제를 자동으로 발견하는 비지도 학습 |
| BERTopic | 트랜스포머 임베딩 기반 토픽 모델링 라이브러리 |
| KcELECTRA | 한국어 특화 사전학습 언어 모델 |

---

## 2. Functional Requirements

### FR-01: Data Collection
- **FR-01-1**: 네이버 블로그에서 "천안" 관련 게시글을 네이버 검색 API로 수집한다.
- **FR-01-2**: 디시인사이드 천안갤러리 게시글을 BeautifulSoup으로 수집한다.
- **FR-01-3**: 천안시청 시민소통 게시판 글을 BeautifulSoup으로 수집한다.
- **FR-01-4**: 네이버 플레이스에서 천안 지역 맛집/카페 리뷰를 Selenium으로 수집한다.
- **FR-01-5**: 카카오맵에서 천안 지역 맛집/카페 리뷰를 Selenium으로 수집한다.
- **FR-01-6**: 크롤러는 설정된 주기(기본 6시간)로 자동 실행된다.
- **FR-01-7**: 중복 게시글/리뷰는 source_id 기반으로 필터링한다.
- **FR-01-8**: robots.txt를 준수하고, 요청 간격을 1초 이상 유지한다.

### FR-02: Sentiment Analysis
- **FR-02-1**: 수집된 텍스트를 KcELECTRA 모델로 긍정/부정/중립으로 분류한다.
- **FR-02-2**: 각 분류에 대한 신뢰도 점수(0.0~1.0)를 함께 저장한다.
- **FR-02-3**: 분석 정확도는 수동 레이블링 100건 대비 80% 이상이어야 한다.

### FR-03: Topic Modeling
- **FR-03-1**: BERTopic + ko-sbert로 게시글 토픽을 자동 분류한다.
- **FR-03-2**: 각 토픽에 대표 키워드를 제공한다.

### FR-04: Keyword Extraction
- **FR-04-1**: KeyBERT + ko-sbert로 문서별 핵심 키워드를 추출한다.
- **FR-04-2**: 키워드 빈도를 집계하여 워드클라우드에 제공한다.

### FR-05: Weekly Summary
- **FR-05-1**: Qwen2.5-14B 모델로 주간 이슈 요약을 생성한다.
- **FR-05-2**: 요약 생성 실패 시 키워드 기반 fallback을 제공한다.

### FR-06: Opinion Dashboard
- **FR-06-1**: 감성 분포 파이 차트를 표시한다. (긍정/부정/중립 비율)
- **FR-06-2**: 일별/주별 감성 추이 라인 차트를 표시한다.
- **FR-06-3**: 소스별 감성 비교 바 차트를 표시한다.
- **FR-06-4**: 키워드 워드클라우드를 표시한다.
- **FR-06-5**: 토픽별 분석 뷰를 제공한다.
- **FR-06-6**: 주간 이슈 요약을 표시한다.
- **FR-06-7**: 소스별, 날짜 범위 필터링을 지원한다.

### FR-07: Place Recommendation
- **FR-07-1**: 감성 점수 기반 맛집/카페 TOP 10 랭킹을 표시한다.
- **FR-07-2**: 키워드 필터(조용한, 넓은, 콘센트, 와이파이)로 카공 카페를 추천한다.
- **FR-07-3**: 카테고리(한식/양식/카페/디저트)별 필터링을 지원한다.
- **FR-07-4**: 카카오맵 API로 장소를 지도에 핀으로 표시한다.
- **FR-07-5**: 가게별 네이버 vs 카카오 리뷰 감성 비교를 제공한다.

### FR-08: Pipeline Management
- **FR-08-1**: API key 인증을 통해 파이프라인을 수동으로 트리거할 수 있다.

---

## 3. Non-Functional Requirements

### NFR-01: Performance
- 대시보드 페이지 로딩: 3초 이내 (캐시된 데이터 기준)
- 파이프라인 전체 실행: 30분 이내 (수집된 데이터 1,000건 기준)

### NFR-02: Security
- API key는 .env 파일로 관리, 커밋 금지
- 개인정보(실명, 연락처) 수집 금지, 닉네임만 허용
- 파이프라인 트리거 API는 인증 필수

### NFR-03: Availability
- Cloudflare Tunnel을 통해 외부에서 접근 가능
- 호스트 Mac이 실행 중일 때 서비스 가용

### NFR-04: Maintainability
- DDD 원칙에 따른 레이어 분리
- 모든 기능 모듈화 (크롤러, 분석기 각각 독립 모듈)
- pytest 기반 단위 테스트 커버리지

### NFR-05: AI Model Constraints
- 모든 AI 모델은 로컬에서 실행 (외부 API 호출 금지)
- AI 모델은 순차 실행 (메모리 경합 방지)
- 최소 사양: 16GB RAM, Apple M1 / Intel i5 10세대

---

## 4. Data Sources

| Source | Type | Method | Rate Limit |
|--------|------|--------|------------|
| Naver Blog | Opinion | Naver Search API | 25,000 req/day |
| DCInside Cheonan Gallery | Opinion | BeautifulSoup | 1 req/sec |
| Cheonan City Hall | Opinion | BeautifulSoup | 1 req/sec |
| Naver Place | Review | Selenium | 1 req/sec |
| KakaoMap | Review | Selenium | 1 req/sec |

---

## 5. Constraints
- X(Twitter): Free tier에서 읽기/검색 불가 → 제외
- Instagram: 공식 API 검색 불가, 이용약관 위반 → 제외
- Everytime: API 미제공, 이용약관 위반 → 제외
