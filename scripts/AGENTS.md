<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# scripts

## Purpose
주기적 또는 수동 트리거로 실행되는 데이터 분석, 재분석, 요약 생성 및 시스템 상태 조회 스크립트를 관리하는 디렉토리. 정규 작업(cronjob), 수동 유지보수, 디버깅 목적의 독립 실행 Python 스크립트들을 포함한다.

## Key Files
| File | Description |
|------|-------------|
| analyze_reviews.py | 장소 리뷰 감성 분석 스크립트: 미분석 place_reviews를 조회하고 SentimentAnalyzer로 분석하여 sentiment/sentiment_score 저장. 진행률 200건 단위로 출력, 최종 감성 분포 통계 출력 |
| dashboard.py | DB 대시보드 스크립트: 프로젝트 현황을 출력 (각 테이블 행 수, 감성 분포, 토픽 Top 5, 부동산 거래유형 등). 시스템 상태 모니터링용 |
| generate_weekly_summary.py | 주간 AI 요약 생성 스크립트: 지난 7일간 천안 관련 게시글을 수집하여 Qwen2.5-14B 모델로 주요 이슈 요약 생성. WeeklySummary 테이블에 저장. 중복 생성 방지 |
| reanalyze_sentiment.py | 감성 분석 재실행 스크립트: 기존 분석 결과를 최신 모델로 재분석하거나 신뢰도 점수를 업데이트할 때 사용. 분석 모듈 개선 후 기존 데이터 갱신 목적 |
| run_tagging.py | 장소 NLP 태깅 스크립트: 모든 Place의 리뷰를 PlaceTagger로 분석하여 카공, 데이트, 가족, 가성비, 조용함 등 태그 추출. place_tags 테이블에 신뢰도와 함께 저장 |

## Subdirectories (if any)
None.

## For AI Agents

### Working In This Directory
- **스크립트 추가**: 새로운 배치 작업(예: 특정 데이터 정제, 모델 재학습)이 필요할 때 이 디렉토리에 `{task_name}.py` 형식으로 추가합니다.
- **실행 스케줄**: 스크립트는 로컬 APScheduler 또는 Cloudflare Cron Trigger로 관리되므로, 새 스크립트 추가 시 backend/scheduler.py 또는 workers-api 설정을 함께 수정합니다.
- **오류 처리**: 각 스크립트가 DB 연결 실패, 모델 로드 오류 등에 대해 명확한 로그를 출력하도록 작성합니다.

### Testing Requirements
스크립트 변경 후 다음을 확인합니다:
- **로컬 실행**: `python scripts/{script_name}.py`를 직접 실행하여 오류 없음 확인
- **DB 상태 검증**: 스크립트 실행 전후 `python scripts/dashboard.py`로 테이블 데이터 변화 확인
- **로그 출력**: 각 스크립트가 처리 진행률, 예외 상황을 명확히 출력하는지 확인
- **멱등성(Idempotency)**: 같은 스크립트를 중복 실행했을 때 중복 데이터 생성 또는 손실이 없는지 확인 (예: generate_weekly_summary.py의 중복 체크)

## Dependencies

### Internal
- backend/database.py: SessionLocal을 통한 DB 연결
- backend/models/ (post.py, place.py, analysis.py 등): SQLAlchemy ORM 모델
- analyzer/sentiment.py: SentimentAnalyzer 클래스 (감성 분석)
- analyzer/tagger.py: PlaceTagger 클래스 (장소 태그 추출)
- analyzer/summarizer.py: TextSummarizer 클래스 (주간 요약 생성)
- analyzer/preprocessor.py: TextPreprocessor 클래스 (텍스트 전처리)

### External
- PostgreSQL: 모든 스크립트의 데이터 소스
- KcELECTRA (로컬): 감성 분석 모델
- Qwen2.5-14B (Ollama): 주간 요약 생성 모델

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
