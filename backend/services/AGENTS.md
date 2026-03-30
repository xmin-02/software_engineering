<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# services

## Purpose
비즈니스 로직 서비스 계층으로, 데이터베이스 쿼리와 데이터 가공을 담당합니다. 대시보드 통계 조회, 장소 정보 필터링 및 순위 계산, 연령별 맞춤 필터링 등의 복잡한 비즈니스 로직을 구현합니다.

## Key Files
| File | Description |
|------|-------------|
| `__init__.py` | (비어있음) |
| `dashboard_service.py` | 대시보드 쿼리 서비스: 게시글, 감성 통계, 트렌드, 토픽, 키워드, 요약 조회 |
| `place_service.py` | 장소 쿼리 서비스: 필터링, 정렬, 순위, 영업시간 확인 |

## For AI Agents

### Working In This Directory
이 디렉토리에서 일할 때는:
1. **함수 기반 설계**: 클래스 기반 서비스 객체 대신 함수로 단순하고 명확한 인터페이스를 제공합니다.
2. **매개변수**: Session과 선택적 필터 매개변수를 받고, tuple(list, total) 또는 dict/list를 반환합니다.
3. **쿼리 최적화**:
   - `selectinload()` 또는 `joinedload()`로 N+1 쿼리 문제를 해결합니다.
   - 대량 데이터 조회 시 일괄 조회(`stats_map` 패턴)로 중복 쿼리를 방지합니다.
4. **스팸 필터링**: SPAM_PATTERNS 리스트를 활용하여 키워드와 토픽의 스팸 항목을 제거합니다.
5. **타입 힌트**: 모든 함수에 입력 타입과 반환 타입을 명시합니다.
6. **집계 함수**: SQLAlchemy `func.count()`, `func.avg()`, `func.date_trunc()` 등을 활용합니다.

### Common Patterns
- **쿼리 빌더**: `query = db.query(...); if filter: query = query.filter(...)`로 조건부 필터를 적용합니다.
- **통계 조회**: `func.count(case((column == value, 1)))`로 조건부 집계를 수행합니다.
- **응답 변환**: ORM 결과를 dict 리스트로 변환하여 JSON 직렬화를 준비합니다.
- **페이지네이션**: offset과 limit으로 페이징을 구현하고, total count를 함께 반환합니다.
- **날짜 구간**: date_from, date_to가 없으면 기본값(최근 30일 등)을 적용합니다.
- **영업시간 검사**: business_hours JSON과 현재 시간을 비교하여 is_open_now를 계산합니다.
- **연령별 필터**: AGE_GROUP_FILTERS 딕셔너리로 연령대별 태그/카테고리 선호도를 관리합니다.
- **부분 정렬**: open_now 필터는 DB 쿼리 후 Python에서 후처리하여 복잡한 비즈니스 로직을 구현합니다.

## Dependencies

### Internal
- `backend.models`: Post, Analysis, Place, PlaceReview, PlaceTag, WeeklySummary 등 ORM 모델
- `backend.schemas`: 응답 데이터 검증 및 직렬화

### External
- `sqlalchemy`: func, case, extract 등 집계 함수
- `sqlalchemy.orm`: Session, selectinload
- `datetime`: date, timedelta

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
