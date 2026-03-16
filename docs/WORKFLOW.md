# Git 작업 플로우 가이드

## 브랜치 구조

| 브랜치 | 용도 | 권한 |
|--------|------|------|
| `main` | 안정 버전 (배포용) | 관리자만 직접 push 가능 |
| `dev` | 개발 브랜치 | 모든 팀원 push 가능 |

## 팀원 작업 플로우

### 1. 최초 세팅 (한 번만)

```bash
git clone https://github.com/xmin-02/software_engineering.git
cd software_engineering
git checkout dev
```

### 2. 작업 시작 전 (매번)

```bash
git checkout dev
git pull origin dev
```

> 항상 최신 코드를 받고 시작하세요.

### 3. 작업 후 커밋 & 푸시

```bash
git add .
git commit -m "간결한 작업 내용 설명"
git push origin dev
```

### 4. main에 반영하기

1. GitHub에서 `dev → main` PR(Pull Request) 생성
2. 관리자가 코드 리뷰 후 승인
3. 승인되면 머지

> main에 직접 push하면 거부됩니다.

## 커밋 메시지 규칙

```
<타입>: <설명>
```

| 타입 | 용도 | 예시 |
|------|------|------|
| `feat` | 새 기능 | `feat: 네이버 블로그 크롤러 추가` |
| `fix` | 버그 수정 | `fix: 중복 게시글 필터링 오류 수정` |
| `docs` | 문서 | `docs: API 명세서 작성` |
| `refactor` | 리팩토링 | `refactor: 크롤러 공통 모듈 분리` |
| `test` | 테스트 | `test: 감성 분석 단위 테스트 추가` |
| `chore` | 설정/기타 | `chore: .gitignore 업데이트` |

## 충돌 발생 시

```bash
git pull origin dev
# 충돌 파일 수동 수정
git add .
git commit -m "fix: merge conflict 해결"
git push origin dev
```

## 주의사항

- `.env` 파일은 절대 커밋하지 마세요 (API 키 등 민감 정보)
- 대용량 모델 파일(`.bin`, `.pt`, `.gguf`)은 커밋하지 마세요
- 작업 전 반드시 `git pull`로 최신 코드를 받으세요
