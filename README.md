# Cheonan Community Sentiment Analysis Dashboard

A web-based dashboard that collects posts from Cheonan-area online communities, performs AI-powered sentiment analysis, and visualizes regional public opinion trends.

> Software Engineering Course Project

## Overview

This system crawls posts from local online communities (Naver Cafe, Naver Blog, X/Twitter) related to Cheonan city, analyzes sentiment and topics using locally-run AI models, and presents the results through an interactive web dashboard.

## Features

- **Data Collection** — Automated crawlers for Naver Cafe, Naver Blog, and X (Twitter)
- **Sentiment Analysis** — Positive / Negative / Neutral classification using KcELECTRA
- **Topic Modeling** — Automatic topic discovery with BERTopic + Korean SBERT
- **Keyword Extraction** — Key phrase extraction per document using KeyBERT
- **Weekly Summary** — AI-generated issue summaries via Qwen2.5-14B (Ollama)
- **Interactive Dashboard** — Sentiment trends, topic breakdown, word clouds, source comparison charts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Crawling | Selenium, BeautifulSoup, Tweepy (X API v2) |
| NLP Preprocessing | konlpy (Mecab) |
| Sentiment Analysis | KcELECTRA-base (local GPU) |
| Topic Modeling | BERTopic + jhgan/ko-sbert-nli |
| Keyword Extraction | KeyBERT + ko-sbert |
| Text Summarization | Qwen2.5-14B-Instruct Q4 (Ollama) |
| Backend | FastAPI |
| Frontend | React + Recharts |
| Database | PostgreSQL |

> All AI models run locally. No external API calls for inference.

## Architecture

```
[Crawlers]                        [Web Dashboard]
 ├─ Naver Cafe (Selenium)              ↑
 ├─ Naver Blog (Search API)        [FastAPI]
 └─ X/Twitter (API v2)                 ↑
        │                        [Analysis Results]
        ▼                              ↑
   [PostgreSQL] ──→ [Analysis Pipeline]
                     ├─ KcELECTRA (Sentiment)
                     ├─ BERTopic (Topics)
                     ├─ KeyBERT (Keywords)
                     └─ Qwen2.5 via Ollama (Summary)
```

## Project Structure

```
software_engineering/
├── crawler/            # Data collection modules
├── analyzer/           # AI analysis pipeline
├── backend/            # FastAPI server
├── frontend/           # React dashboard
├── docs/               # SW engineering documents (SRS, design, test reports)
├── tests/              # Unit & integration tests
└── scripts/            # Utility scripts
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 16+
- Ollama

### Installation

```bash
# Clone repository
git clone https://github.com/xmin-02/software_engineering.git
cd software_engineering

# Backend setup
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install

# Pull AI model
ollama pull qwen2.5:14b-instruct-q4_K_M
```

### Run

```bash
# Start database
# (PostgreSQL should be running)

# Run crawlers
python -m crawler.run

# Run analysis pipeline
python run_pipeline.py

# Start backend
uvicorn backend.main:app --reload

# Start frontend (in another terminal)
cd frontend && npm start
```

## Git Workflow

See [docs/WORKFLOW.md](docs/WORKFLOW.md) for the team's Git branching strategy and commit conventions.

| Branch | Purpose |
|--------|---------|
| `main` | Stable release (admin push only, PR required) |
| `dev` | Development branch (all team members) |

## Development Timeline (14 Weeks)

| Phase | Weeks | Description |
|-------|-------|-------------|
| Design | 1-2 | Requirements (SRS), system design, DB schema, wireframes |
| Crawlers | 3-5 | Naver Blog, Naver Cafe, X crawlers + scheduler |
| AI Pipeline | 6-8 | Preprocessing, sentiment, topics, keywords, summarization |
| Dashboard | 9-11 | FastAPI endpoints, React charts, filtering |
| Wrap-up | 12-14 | Integration testing, documentation, presentation |

## License

This project is for educational purposes only.

---

# 천안 지역 커뮤니티 감성 분석 대시보드

천안 지역 온라인 커뮤니티 게시글을 수집하고, AI 기반 감성 분석을 수행하여 지역 여론 동향을 시각화하는 웹 대시보드입니다.

> 소프트웨어 공학 수업 프로젝트

## 개요

네이버 카페, 네이버 블로그, X(트위터)에서 천안 관련 게시글을 크롤링하고, 로컬에서 실행되는 AI 모델로 감성 및 토픽을 분석한 뒤, 인터랙티브 웹 대시보드로 결과를 제공합니다.

## 주요 기능

- **데이터 수집** — 네이버 카페, 네이버 블로그, X(트위터) 자동 크롤링
- **감성 분석** — KcELECTRA 기반 긍정/부정/중립 분류
- **토픽 모델링** — BERTopic + 한국어 SBERT로 자동 주제 발견
- **키워드 추출** — KeyBERT를 활용한 문서별 핵심 키워드 추출
- **주간 요약** — Qwen2.5-14B (Ollama)로 AI 이슈 요약 생성
- **인터랙티브 대시보드** — 감성 추이, 토픽 분석, 워드클라우드, 소스별 비교 차트

## 기술 스택

| 영역 | 기술 |
|------|------|
| 크롤링 | Selenium, BeautifulSoup, Tweepy (X API v2) |
| 자연어 전처리 | konlpy (Mecab) |
| 감성 분석 | KcELECTRA-base (로컬 GPU) |
| 토픽 모델링 | BERTopic + jhgan/ko-sbert-nli |
| 키워드 추출 | KeyBERT + ko-sbert |
| 텍스트 요약 | Qwen2.5-14B-Instruct Q4 (Ollama) |
| 백엔드 | FastAPI |
| 프론트엔드 | React + Recharts |
| 데이터베이스 | PostgreSQL |

> 모든 AI 모델은 로컬에서 실행됩니다. 추론을 위한 외부 API 호출이 없습니다.

## 아키텍처

```
[크롤러]                           [웹 대시보드]
 ├─ 네이버 카페 (Selenium)              ↑
 ├─ 네이버 블로그 (검색 API)         [FastAPI]
 └─ X/트위터 (API v2)                   ↑
        │                        [분석 결과]
        ▼                              ↑
   [PostgreSQL] ──→ [분석 파이프라인]
                     ├─ KcELECTRA (감성 분석)
                     ├─ BERTopic (토픽 분류)
                     ├─ KeyBERT (키워드 추출)
                     └─ Qwen2.5 via Ollama (요약)
```

## 프로젝트 구조

```
software_engineering/
├── crawler/            # 데이터 수집 모듈
├── analyzer/           # AI 분석 파이프라인
├── backend/            # FastAPI 서버
├── frontend/           # React 대시보드
├── docs/               # SW공학 산출물 (SRS, 설계서, 테스트 보고서)
├── tests/              # 단위 및 통합 테스트
└── scripts/            # 유틸리티 스크립트
```

## 시작하기

### 사전 요구사항

- Python 3.11+
- Node.js 20+
- PostgreSQL 16+
- Ollama

### 설치

```bash
# 저장소 클론
git clone https://github.com/xmin-02/software_engineering.git
cd software_engineering

# 백엔드 세팅
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 프론트엔드 세팅
cd frontend
npm install

# AI 모델 다운로드
ollama pull qwen2.5:14b-instruct-q4_K_M
```

### 실행

```bash
# 데이터베이스 시작
# (PostgreSQL이 실행 중이어야 합니다)

# 크롤러 실행
python -m crawler.run

# 분석 파이프라인 실행
python run_pipeline.py

# 백엔드 시작
uvicorn backend.main:app --reload

# 프론트엔드 시작 (다른 터미널에서)
cd frontend && npm start
```

## Git 작업 플로우

팀의 Git 브랜치 전략과 커밋 규칙은 [docs/WORKFLOW.md](docs/WORKFLOW.md)를 참고하세요.

| 브랜치 | 용도 |
|--------|------|
| `main` | 안정 버전 (관리자만 push 가능, PR 필수) |
| `dev` | 개발 브랜치 (모든 팀원 작업) |

## 개발 일정 (14주)

| 단계 | 주차 | 내용 |
|------|------|------|
| 설계 | 1-2 | 요구사항 명세(SRS), 시스템 설계, DB 스키마, 와이어프레임 |
| 크롤러 | 3-5 | 네이버 블로그, 네이버 카페, X 크롤러 + 스케줄러 |
| AI 파이프라인 | 6-8 | 전처리, 감성분석, 토픽, 키워드, 요약 |
| 대시보드 | 9-11 | FastAPI 엔드포인트, React 차트, 필터링 |
| 마무리 | 12-14 | 통합 테스트, 문서 작성, 발표 준비 |

## 라이선스

이 프로젝트는 교육 목적으로만 사용됩니다.
