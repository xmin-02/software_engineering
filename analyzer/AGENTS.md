<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# analyzer

## Purpose
한국어 텍스트 분석 파이프라인. 크롤링된 텍스트를 전처리하고 감성 분석, 키워드 추출, 토픽 모델링, 요약을 순차적으로 수행한다. 모든 모델은 로컬에서 실행되며, 형태소 분석(Mecab), 감정 분류(KcELECTRA), 의미 검색(SBERT), 토픽 학습(BERTopic)을 지원한다.

## Key Files
| File | Description |
|------|-------------|
| preprocessor.py | Mecab 기반 한국어 형태소 분석 및 텍스트 정제 (HTML/URL/특수문자 제거, 토큰화, 불용어 필터링) |
| sentiment.py | KcELECTRA 기반 감정 분류 (11개 감정 → 긍정/부정/중립 매핑, 신뢰도 기반 필터링) |
| keyword.py | KeyBERT + ko-sbert-nli 기반 키워드 추출 (다중성(MMR) 사용, 단독/배치 모드) |
| topic.py | BERTopic 기반 토픽 모델링 (문서 클러스터링, 토픽별 대표 키워드 추출) |
| summarizer.py | Ollama(Qwen2.5) 기반 텍스트 요약 (다중 문서 통합 요약, 토픽별 요약 생성) |
| tagger.py | 패턴 매칭 기반 장소 태그 추출 (카공, 데이트, 단체석, 가족, 가성비, 조용함, 노키즈존, 키즈시설) |
| pipeline.py | 분석 파이프라인 오케스트레이터 (감성 → 키워드 → 토픽 순차 실행, DB 저장) |
| __init__.py | 패키지 진입점 (현재 비어있음) |

## For AI Agents

### Working In This Directory
- 모든 NLP 모델은 **lazy load** (초기화 시 로드되지 않음, 첫 사용 시 로드)
- Mecab 설정: Apple Silicon Homebrew 경로 기본값 (`/opt/homebrew/lib/mecab/dic/mecab-ko-dic`)
- DB 작업은 `backend.database.SessionLocal()` 사용
- 형태소 분석 결과: 명사(NN*), 동사(VV), 형용사(VA)만 추출 (길이 > 1)
- 감정 분류 신뢰도 < 0.4일 때 자동 중립 처리
- 토픽 모델링 최소 문서 수: 50개 (미만이면 스킵)

### Testing Requirements
- **Preprocessor**: 한글 입력 → 토큰화 검증, HTML/URL 제거 확인
- **Sentiment**: 긍정/부정/중립 분류 정확도 (11개 감정 매핑 검증)
- **Keyword**: 상위 N개 키워드 추출 (중복 없음, MMR 다양성 확인)
- **Topic**: 50개 이상 문서에서 토픽 할당, 토픽 라벨 생성 검증
- **Summarizer**: Ollama 서버 실행 필요 (`http://localhost:11434/api/generate`), 요약 생성 시간 < 120s
- **Tagger**: 리뷰 텍스트 → 태그별 신뢰도(0~1) 반환
- **Pipeline**: 미분석 게시글 조회 → 감성 → 키워드 → 토픽 순차 실행, 각 단계별 개수 반환

### Common Patterns
- **상태 추적**: `Analysis` 테이블에서 `sentiment/keywords/topic` NULL 확인으로 미완료 단계 검출
- **배치 처리**: `KeywordExtractor.extract_batch()`, `TextSummarizer.summarize_by_topic()` 등 배치 API 제공
- **에러 핸들링**: DB 작업에서 예외 발생 시 rollback 후 raise
- **설정**: `backend.config.settings`에서 Ollama URL 등 설정값 읽음 (환경 변수 대체 가능)
- **모델 라벨 매핑**: LABEL_MAP (인덱스 → 감정), ID2LABEL (인덱스 → 감정 이름)

## Dependencies

### Internal
- `backend.models.post` (Post 모델)
- `backend.models.analysis` (Analysis 모델)
- `backend.database` (SessionLocal, DB 연결)
- `backend.config` (settings 설정값)

### External
- **konlpy** (Mecab 형태소 분석)
- **torch** (PyTorch, 모델 추론)
- **transformers** (AutoTokenizer, AutoModelForSequenceClassification)
- **keybert** (KeyBERT 키워드 추출)
- **sentence-transformers** (SentenceTransformer, 의미 임베딩)
- **bertopic** (BERTopic 토픽 모델링)
- **requests** (Ollama API 통신)
- **sqlalchemy** (ORM 쿼리)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
