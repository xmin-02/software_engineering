<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# db

## Purpose
PostgreSQL 데이터베이스 초기화 스크립트를 관리하는 디렉토리. 여론 분석, 맛집/카페 정보, 이벤트, 연령별 콘텐츠(공모전, 장학금, 채용, 부동산, 자격증, 대학 공지) 등 모든 테이블 스키마와 인덱스를 정의한다.

## Key Files
| File | Description |
|------|-------------|
| init.sql | 전체 DB 스키마 정의 (테이블 11개 생성, 20개 인덱스 생성). posts, analysis, places, place_reviews, place_tags, events, contests, scholarships, jobs, real_estate, university_notices, weekly_summaries, certifications |

## Subdirectories (if any)
None.

## For AI Agents

### Working In This Directory
- **스키마 수정**: 새로운 데이터 소스 추가나 데이터 구조 변경 시 init.sql을 수정합니다.
  - 새 테이블 추가: CREATE TABLE 문 작성, 적절한 인덱스 추가
  - 기존 테이블 컬럼 추가: ALTER TABLE 사용 (단, init.sql은 처음부터 생성하는 스크립트이므로 CREATE TABLE에서 수정)
  - 외래키/관계 설정: 데이터 무결성 유지하도록 ON DELETE CASCADE 정의
- **마이그레이션 관리**: init.sql은 "처음부터 생성"하는 이디엠포턴트 스크립트. 실행 환경에서 기존 테이블을 먼저 삭제하거나 IF NOT EXISTS 조건 활용.

### Testing Requirements
DB 스키마 변경 후 다음을 확인합니다:
- 스크립트 문법: PostgreSQL에서 `psql -U postgres -d cheonan_sentiment -f db/init.sql` 실행하여 오류 없음 확인
- 테이블 생성: `SELECT table_name FROM information_schema.tables WHERE table_schema='public'` 쿼리로 모든 테이블 생성 확인
- 인덱스 생성: `SELECT indexname FROM pg_indexes WHERE schemaname='public'` 쿼리로 인덱스 생성 확인
- 데이터 타입: 각 테이블의 컬럼 타입이 backend 모델(ORM) 정의와 일치하는지 확인

## Dependencies

### Internal
- backend/models/ (post.py, place.py, content.py 등): SQLAlchemy ORM 모델이 init.sql의 테이블 구조와 일치해야 함
- analyzer/ 모듈: 분석 결과를 analysis, place_reviews 테이블에 저장
- crawler/ 모듈: 수집한 데이터를 posts, places, jobs 등 테이블에 저장

### External
- PostgreSQL 서버: config/database.json의 연결 정보로 접근

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
