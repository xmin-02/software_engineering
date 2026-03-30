<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# test_analyzers

## Purpose
감성 분석, 토픽 모델링, 키워드 추출, 요약 등의 AI 분석 모듈에 대한 유닛 테스트 디렉토리. 현재는 초기화 파일만 존재한다.

## Key Files
| File | Description |
|------|-------------|
| __init__.py | 패키지 마커 (테스트 모듈로 인식하게 함) |

## For AI Agents

### Working In This Directory
이 디렉토리에서 작업할 때는:
- **테스트 작성**: 감성 분석, 토픽 모델링, 키워드 추출, 텍스트 요약 각 모듈당 하나의 테스트 파일 생성.
- **파일 규칙**: `test_<module_name>.py` 형식. 예: `test_sentiment.py`, `test_topic.py`.
- **테스트 실행**: pytest로 실행. `pytest tests/test_analyzers/`
- **모의 객체**: unittest.mock 활용하여 모델 로딩 및 추론 모의화.
- **Fixture**: pytest fixture로 샘플 텍스트, 예상 결과 등 관리.

### Test Structure Pattern
```python
import pytest
from analyzer.<module> import <AnalyzerClass>

@pytest.fixture
def analyzer():
    return <AnalyzerClass>(...)

def test_analyze_basic(analyzer):
    """기본 분석 검증"""
    result = analyzer.analyze("테스트 텍스트")
    assert result is not None
    assert 'score' in result or 'label' in result
```

## Dependencies

### Internal
- `analyzer.*` — 감성, 토픽, 키워드, 요약 분석 모듈 (구현 필요)

### External
- `pytest` — 테스트 프레임워크
- `unittest.mock` — 모의 객체 라이브러리

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
