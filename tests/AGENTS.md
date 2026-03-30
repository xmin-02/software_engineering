<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# tests

## Purpose
pytest 기반의 단위 테스트 및 통합 테스트를 관리하는 디렉토리. 크롤러, API 엔드포인트, 분석 모듈의 정확성과 안정성을 검증하여 회귀(regression) 방지 및 리팩토링 신뢰도를 확보한다.

## Key Files
| File | Description |
|------|-------------|
| __init__.py | 테스트 패키지 초기화 파일 |

## Subdirectories (if any)
| Directory | Purpose |
|-----------|---------|
| test_crawlers/ | 크롤러 모듈 단위 테스트 (test_naver_blog.py, test_dcinside.py, test_cheonan_city.py, test_places.py) |
| test_analyzers/ | 분석 모듈 단위 테스트 (감성 분석, 토픽 모델링, 키워드 추출 등) |
| test_api/ | FastAPI 엔드포인트 통합 테스트 (요청/응답 검증) |

## For AI Agents

### Working In This Directory
- **크롤러 테스트 추가**: 새로운 크롤러 모듈 추가 시 test_crawlers/에 해당 테스트 파일을 함께 작성합니다.
  - Mock API 응답 작성 (실제 크롤링 없이 로컬 테스트)
  - HTML 파싱, 중복 필터링, 데이터 타입 검증
- **분석 모듈 테스트**: analyzer/ 모듈 변경 시 test_analyzers/의 테스트를 수정하여 모델 정확도 유지.
- **API 엔드포인트 테스트**: backend/routes/ 변경 시 test_api/에서 HTTP 요청/응답, 인증, 에러 핸들링을 검증.
- **테스트 커버리지**: 중요 로직(중복 필터링, 감성 분석 신뢰도, 캐싱 등)은 80% 이상의 커버리지를 목표로.

### Testing Requirements
테스트 추가/수정 후 다음을 확인합니다:
- **pytest 실행**: `pytest` 또는 `pytest -v`로 모든 테스트 통과 확인
- **목(Mock) 사용**: 외부 API(네이버, 카카오)는 Mock으로 대체하여 격리된 테스트 환경 구성
- **DB 테스트**: test_api/에서는 테스트 DB 인스턴스 또는 트랜잭션 롤백으로 부작용 방지
- **커버리지**: `pytest --cov=crawler --cov=analyzer --cov=backend --cov-report=term-missing`으로 커버리지 확인

## Dependencies

### Internal
- crawler/ (naver_blog.py, dcinside.py, cheonan_city.py, naver_place.py, places.py): 테스트 대상
- analyzer/ (sentiment.py, topic.py, keyword.py, summarizer.py, tagger.py, preprocessor.py): 테스트 대상
- backend/ (main.py, routes/, models/, database.py): 테스트 대상
- backend/models/ (post.py, place.py, analysis.py 등): ORM 모델 사용

### External
- pytest: 테스트 프레임워크
- unittest.mock: Mock, MagicMock 등 테스트 더블(doubles) 라이브러리
- SQLAlchemy (테스트 DB 세션): 격리된 DB 트랜잭션 관리

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
