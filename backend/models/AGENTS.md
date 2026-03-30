<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# models

## Purpose
데이터베이스 ORM 엔티티 계층으로, 천안시 정보 분석 플랫폼의 모든 데이터 모델을 정의합니다. 게시글, 분석 결과, 장소 정보, 주간 요약, 이벤트, 공모전, 장학금, 채용공고, 부동산, 자격시험, 대학 공지사항 등을 관리하는 SQLAlchemy ORM 모델을 포함합니다.

## Key Files
| File | Description |
|------|-------------|
| `__init__.py` | 모든 모델을 export하는 통합 진입점 |
| `post.py` | 블로그/뉴스 게시글 모델 (Post) |
| `analysis.py` | 게시글 분석 결과 모델 (Analysis) - 감성, 토픽, 키워드 저장 |
| `place.py` | 레스토랑/카페 정보 모델 (Place, PlaceReview, PlaceTag) |
| `content.py` | 이벤트, 공모전, 장학금, 채용, 부동산, 자격시험, 대학공지 모델 |
| `topic.py` | 토픽 모델 (Topic) - 키워드와 post_count 추적 |

## For AI Agents

### Working In This Directory
이 디렉토리에서 일할 때는:
1. **모델 추가/수정 시**: SQLAlchemy 2.0 ORM 문법(`Mapped`, `mapped_column`, `relationship`)을 따릅니다.
2. **관계 설정**: 외래키(ForeignKey), 일대다(relationship), 계단식 삭제(cascade) 구성을 명시합니다.
3. **인덱싱**: 자주 조회되는 필드(source, sentiment, published_at, category 등)에는 `index=True`를 추가합니다.
4. **타입 힌트**: 모든 필드에 타입 힌트를 명시하고, Optional 필드는 `|None` 기호를 사용합니다.
5. **__all__ 갱신**: 새 모델 추가 시 `__init__.py`의 `__all__`에 등록합니다.

### Common Patterns
- **Post-Analysis 관계**: Post는 여러 Analysis를 가질 수 있고, cascade 삭제로 게시글 삭제 시 분석 결과도 함께 삭제됩니다.
- **Place 계층구조**: Place → PlaceReview(일대다) → PlaceTag(일대다) 구조로 리뷰와 태그를 관리합니다.
- **Topic 참조**: Analysis가 Topic을 참조하여 토픽 분석 결과를 추적합니다.
- **날짜/시간 추적**: `collected_at`, `published_at`, `analyzed_at` 등으로 수집/발행/분석 시간을 기록합니다.
- **JSON 필드**: business_hours, sentiment_ratio 등 유연한 데이터는 JSON 타입으로 저장합니다.
- **고유 필드**: source_id는 중복 방지를 위해 `unique=True`로 설정됩니다.

## Dependencies

### Internal
- `backend.database`: Base 클래스 (SQLAlchemy declarative base)

### External
- `sqlalchemy`: ORM 프레임워크 (2.0+)
- `sqlalchemy.orm`: Mapped, mapped_column, relationship 등의 타입 및 함수

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
