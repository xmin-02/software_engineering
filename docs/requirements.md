# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
천안 지역 온라인 커뮤니티 게시글을 AI 기반으로 감성 분석하고, 연령대별 맞춤 생활 정보(맛집/카페, 취업, 장학금, 부동산, 행사 등)를 제공하는 웹 대시보드 시스템.

### 1.2 Scope
- 다중 데이터 소스에서 자동 크롤링 (여론, 맛집, 취업, 장학금, 부동산, 행사)
- 로컬 AI 모델 기반 감성 분석, 토픽 모델링, 키워드 추출, 요약
- 메인 대시보드 + 연령별 5개 탭 웹 대시보드
- Cloudflare를 통한 외부 접근 가능 배포

### 1.3 Definitions
| 용어 | 정의 |
|------|------|
| 감성 분석 | 텍스트의 긍정/부정/중립 감정을 분류하는 NLP 작업 |
| 토픽 모델링 | 문서 집합에서 주제를 자동으로 발견하는 비지도 학습 |
| NLP 태깅 | 리뷰 텍스트에서 키워드 패턴으로 장소 속성을 추출하는 작업 |

---

## 2. Functional Requirements

### FR-01: Data Collection — Opinion

- **FR-01-1**: 네이버 블로그에서 "천안" 관련 게시글을 네이버 검색 API로 수집한다.
- **FR-01-2**: 디시인사이드 천안갤러리 게시글을 BeautifulSoup으로 수집한다.
- **FR-01-3**: 천안시청 시민소통 게시판 글을 BeautifulSoup으로 수집한다.
- **FR-01-4**: 크롤러는 설정된 주기(기본 6시간)로 자동 실행된다.
- **FR-01-5**: 중복 게시글은 source_id 기반으로 필터링한다.
- **FR-01-6**: 게시글에 원본 URL을 저장하여 클릭 시 이동 가능하게 한다.
- **FR-01-7**: robots.txt를 준수하고, 요청 간격을 1초 이상 유지한다.

### FR-02: Data Collection — Places

- **FR-02-1**: 네이버 장소 검색 API로 천안 지역 맛집/카페 메타데이터를 수집한다. (이름, 주소, 카테고리, 영업시간, 주차 등)
- **FR-02-2**: 카카오 장소 검색 API로 천안 지역 맛집/카페 메타데이터를 수집한다.
- **FR-02-3**: 네이버 블로그 검색 API로 맛집/카페 리뷰 텍스트를 수집한다.
- **FR-02-4**: 리뷰 직접 크롤링(네이버 플레이스/카카오맵)은 하지 않는다.

### FR-03: Data Collection — Age-Based Content

- **FR-03-1**: 대학교 홈페이지(순천향대, 백석대, 단국대 천안)에서 공지사항, 공모전 정보를 수집한다.
- **FR-03-2**: 한국장학재단/data.go.kr에서 장학금 정보를 수집한다.
- **FR-03-3**: 사람인 API로 천안 지역 채용 정보를 수집한다.
- **FR-03-4**: 잡코리아 API로 천안 지역 채용 정보를 수집한다. (API 심사 탈락 시 사람인만 사용)
- **FR-03-5**: data.go.kr API로 부동산 실거래가/매물 정보를 수집한다.
- **FR-03-6**: data.go.kr API로 천안시 문화행사/축제 정보를 수집한다.
- **FR-03-7**: 직방/다방은 크롤링하지 않는다. (법적 판례 존재)

### FR-04: Sentiment Analysis

- **FR-04-1**: 수집된 텍스트를 KcELECTRA 모델로 긍정/부정/중립으로 분류한다.
- **FR-04-2**: 각 분류에 대한 신뢰도 점수(0.0~1.0)를 함께 저장한다.
- **FR-04-3**: 분석 정확도는 수동 레이블링 100건 대비 80% 이상이어야 한다.

### FR-05: Topic Modeling & Keywords

- **FR-05-1**: BERTopic + ko-sbert로 게시글 토픽을 자동 분류한다.
- **FR-05-2**: KeyBERT + ko-sbert로 문서별 핵심 키워드를 추출한다.

### FR-06: Weekly Summary

- **FR-06-1**: Qwen2.5-14B 모델로 주간 이슈 요약을 생성한다.
- **FR-06-2**: 요약 생성 실패 시 키워드 기반 fallback을 제공한다.

### FR-07: Place NLP Tagging

- **FR-07-1**: 블로그 리뷰에서 키워드 패턴으로 장소 태그를 추출한다.
  - 카공: "작업", "콘센트", "와이파이", "공부"
  - 데이트: "분위기", "데이트", "커플"
  - 단체석: "단체", "모임", "대형 테이블"
  - 가족: "아이", "유아", "키즈", "가족"
  - 가성비: "가성비", "저렴", "학생"
  - 조용한: "조용", "한적"
  - 노키즈존: "노키즈존", "노키즈"
  - 키즈시설: "키즈존", "놀이방", "유아의자"
- **FR-07-2**: 추출된 태그를 place_tags 테이블에 신뢰도 점수와 함께 저장한다.

### FR-08: Main Dashboard

- **FR-08-1**: 오늘의 토픽을 여러 개 순환 표시한다.
- **FR-08-2**: 주간 토픽을 표시한다.
- **FR-08-3**: 천안시 관련 포스트 목록을 표시하고, 클릭 시 원본 링크로 이동한다.
- **FR-08-4**: 천안시 행사 정보를 표시하고, 클릭 시 해당 링크로 이동한다.
- **FR-08-5**: 토픽 트렌드 차트를 표시한다.
- **FR-08-6**: AI 서머리(주요 토픽 트렌드 요약)를 표시한다.
- **FR-08-7**: Trending Topics 카드, Recent Posts 테이블(감성 태그 포함)을 표시한다.
- **FR-08-8**: 감성 분포 파이 차트, 일별 감성 추이 라인 차트, 소스별 비교 바 차트를 표시한다.
- **FR-08-9**: 키워드 워드클라우드를 표시한다.

### FR-09: Age-Based Tabs

공통: 문화 여가 생활 정보 + 맛집 정보 포함.
맛집 공통: "현재 영업 중" + "라스트오더 1시간 전"까지만 표시 토글 버튼.
- 라스트오더 미기재 시 영업종료 1시간 전으로 대체.

- **FR-09-1 (청소년)**: 대학 정보, 입시 트렌드 표시. 맛집은 청소년 방문 불가 업소(술집 등) 제외, 저렴한 카페/식당 필터.
- **FR-09-2 (대학생)**: 공모전, 장학금, 취업 정보(간소화), 교통 정보(대중교통), 자격증 정보, 자취방 정보 표시. 맛집은 주차, 가성비, 데이트, 카공, 술집, 단체석 필터.
- **FR-09-3 (사회초년생)**: 취업 정보, 취업 제도, 자격증 정보, 쇼핑몰 정보 표시. 맛집은 가성비~중간 가격대 필터.
- **FR-09-4 (직장인)**: 취업/이직 정보, 쇼핑몰 정보, 대중교통 정보, 드라이브 추천지 표시. 맛집은 전체(필터 없음).
- **FR-09-5 (가족)**: 부동산 정보, 가족 놀거리 표시. 맛집은 주차 가능, 가족 친화, 키즈시설 구비, 노키즈존 제외 필터.

### FR-10: Pipeline Management

- **FR-10-1**: API key 인증을 통해 파이프라인을 수동으로 트리거할 수 있다.

---

## 3. Non-Functional Requirements

### NFR-01: Performance
- 대시보드 페이지 로딩: 3초 이내 (캐시된 데이터 기준)
- 파이프라인 전체 실행: 60분 이내

### NFR-02: Security
- API key는 .env 파일로 관리, 커밋 금지
- 개인정보(실명, 연락처) 수집 금지, 닉네임만 허용
- 파이프라인 트리거 API는 인증 필수

### NFR-03: Availability
- Cloudflare Tunnel을 통해 외부에서 접근 가능
- 호스트 Mac이 실행 중일 때 서비스 가용

### NFR-04: Maintainability
- DDD 원칙에 따른 레이어 분리
- 연령별 대분류 + 기능별 중분류 모듈화 (추가/삭제 용이)
- pytest 기반 단위 테스트

### NFR-05: AI Model Constraints
- 모든 AI 모델은 로컬에서 실행 (외부 API 호출 금지)
- AI 모델은 순차 실행 (메모리 경합 방지)
- 최소 사양: 16GB RAM, Apple M1 / Intel i5 10세대

### NFR-06: Legal Compliance
- robots.txt 준수
- 공식 API 우선 사용, 직접 크롤링은 이용약관 확인 후에만
- 네이버 플레이스/카카오맵 리뷰, 직방/다방 직접 크롤링 금지

---

## 4. Data Sources

### Safe (Official API)
| Source | API | Rate Limit |
|--------|-----|------------|
| Naver Blog | Naver Search API | 25,000 req/day |
| Naver Place | Naver Place Search API | metadata only |
| Kakao Place | Kakao Place Search API | metadata only |
| Saramin | Saramin Open API | 500 req/day |
| data.go.kr (events) | Cultural Festival API | public |
| data.go.kr (real estate) | Real Transaction API | public |
| KOSAF (scholarships) | Public data | public |

### Conditional (Direct Crawling, Low Risk)
| Source | Method | Rate Limit |
|--------|--------|------------|
| DCInside Cheonan Gallery | BeautifulSoup | 1 req/sec |
| Cheonan City Hall | BeautifulSoup | 1 req/sec |
| University websites | BeautifulSoup | 1 req/sec |

### Prohibited
| Source | Reason |
|--------|--------|
| Naver Place reviews | ToS violation |
| KakaoMap reviews | robots.txt blocked, ToS violation |
| Zigbang | Legal precedent (damages ruling) |
| Dabang | robots.txt 403, legal risk |
| X (Twitter) | Free tier read unavailable |
| Instagram | No search API, ToS violation |
| Everytime | No API, ToS violation |
