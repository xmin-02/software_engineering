# Project Rules

These rules MUST be preserved across context compression. Never discard or summarize these instructions.

## Git

- All commit messages MUST be in English.
- ALWAYS ask for confirmation before committing and pushing. Never auto-commit.
- Follow conventional commit format: `type: description` (feat, fix, docs, refactor, test, chore).
- Branch strategy: `main` is admin-only (direct push). All team members work on `dev` branch and merge via PR.

## Architecture

- Follow Domain-Driven Design (DDD) principles.
  - Separate domain, application, infrastructure, and presentation layers.
  - Define clear bounded contexts for each module (crawler, analyzer, backend, frontend).
  - Use domain entities and value objects where appropriate.
- All features MUST be modularized for maintainability.
  - Each crawler is an independent module.
  - Each AI analysis step (sentiment, topic, keyword, summary) is an independent module.
  - Shared logic goes in a common/utils module, not duplicated.

## Data Sources

- Regional opinion: Naver Blog, DCInside Cheonan Gallery, Cheonan City Hall (Civil Communication).
- Restaurant/cafe reviews: Naver Place, KakaoMap.
- Total 5 sources. Do NOT add X(Twitter), Instagram, or Everytime.

## Development Process

- Before starting each phase, create a detailed sub-plan and discuss with me first.
- Do NOT proceed with implementation until the sub-plan is approved.
- Phase order: Design → Crawlers + AI Prep + Frontend Skeleton → AI Pipeline → Dashboard + Deploy → Wrap-up.

## Tech Stack

- Backend: FastAPI (Python)
- Frontend: React + Recharts
- Database: PostgreSQL
- Crawling: Selenium, BeautifulSoup, Naver Search API
- NLP Preprocessing: konlpy (Mecab)
- Sentiment Analysis: KcELECTRA-base (local)
- Topic Modeling: BERTopic + jhgan/ko-sbert-nli
- Keyword Extraction: KeyBERT + ko-sbert
- Text Summarization: Qwen2.5-14B-Instruct Q4 (Ollama)
- Hosting: Cloudflare (Tunnel for API, Pages for frontend)
- All AI models run locally. No external AI API calls.

## Code Style

- Python: follow PEP 8, type hints required.
- React: functional components, hooks only.
- Keep functions small and single-purpose.
- Write efficient code. Avoid unnecessary computation, redundant loops, and excessive memory usage.
- Comments in Korean, keep comments minimal — only where logic is not self-evident.

## Language

- Communication with user: Korean.
- Commit messages: English.
- Code comments: Korean (minimal).
- Code (variables, functions, classes): English.

## Security

- Store API keys and secrets in `.env` only. Never commit `.env` files.
- Do NOT collect personal information (real names, phone numbers, addresses). Nicknames only.

## Testing

- Use pytest for Python tests.
- Write unit tests for each module (crawlers, analyzers, API endpoints).
