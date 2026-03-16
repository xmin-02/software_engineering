# Cheonan Community Sentiment Analysis Dashboard

A web-based dashboard that collects posts from Cheonan-area online communities and local restaurant/cafe reviews, performs AI-powered sentiment analysis, and visualizes regional public opinion trends with place recommendations.

> Software Engineering Course Project

## Overview

This system crawls posts from local online communities (Naver Blog, DCInside Cheonan Gallery, Cheonan City Hall) and restaurant/cafe reviews (Naver Place, KakaoMap) related to Cheonan city. It analyzes sentiment and topics using locally-run AI models, and presents the results through an interactive web dashboard with two main features: regional opinion analysis and restaurant/cafe recommendations.

## Features

### Regional Opinion Analysis (Main)
- **Data Collection** — Automated crawlers for Naver Blog, DCInside Cheonan Gallery, and Cheonan City Hall
- **Sentiment Analysis** — Positive / Negative / Neutral classification using KcELECTRA
- **Topic Modeling** — Automatic topic discovery with BERTopic + Korean SBERT
- **Keyword Extraction** — Key phrase extraction per document using KeyBERT
- **Weekly Summary** — AI-generated issue summaries via Qwen2.5-14B (Ollama)
- **Interactive Dashboard** — Sentiment trends, topic breakdown, word clouds, source comparison charts

### Restaurant & Cafe Recommendations (Sub)
- **Multi-Platform Reviews** — Naver Place + KakaoMap review collection and cross-analysis
- **Sentiment-Based Ranking** — Top restaurants/cafes ranked by review sentiment score
- **Study Cafe Finder** — Filter by keywords like "quiet", "spacious", "power outlets", "WiFi"
- **Map Visualization** — Pin-based map view with KakaoMap API integration
- **Platform Comparison** — Naver vs KakaoMap sentiment comparison per venue

## Data Sources

### Regional Opinion Analysis

| Source | Role | Method |
|--------|------|--------|
| Naver Blog | Daily life, tourism, general opinion | Naver Search API |
| DCInside Cheonan Gallery | Anonymous candid opinions | BeautifulSoup (no login required) |
| Cheonan City Hall (Civil Communication) | Official complaints, suggestions | BeautifulSoup (public board) |

### Restaurant & Cafe Reviews

| Source | Role | Method |
|--------|------|--------|
| Naver Place | High volume reviews, blog review links | Selenium |
| KakaoMap | High credibility reviews, cross-validation | Selenium |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Crawling | Selenium, BeautifulSoup, Naver Search API |
| NLP Preprocessing | konlpy (Mecab) |
| Sentiment Analysis | KcELECTRA-base (local GPU, ~1GB) |
| Topic Modeling | BERTopic + jhgan/ko-sbert-nli |
| Keyword Extraction | KeyBERT + ko-sbert |
| Text Summarization | Qwen2.5-14B-Instruct Q4 (Ollama, ~8-10GB) |
| Backend | FastAPI |
| Frontend | React + Recharts |
| Database | PostgreSQL |
| Hosting | Cloudflare (Tunnel / Pages) |

> All AI models run locally. No external API calls for inference. Models run sequentially to prevent memory contention.

## System Requirements

### Minimum

| Component | Specification |
|-----------|--------------|
| CPU | Apple M1 / Intel i5 10th gen or later |
| RAM | 16 GB |
| Storage | 20 GB free |
| GPU | Not required (CPU inference available) |
| OS | macOS 13+ / Ubuntu 22.04+ / Windows 11 (WSL2) |

> With minimum specs, use `Qwen2.5-7B Q4` instead of 14B for summarization.

### Recommended

| Component | Specification |
|-----------|--------------|
| CPU | Apple M-series (M1 Pro or later) / Intel i7 12th gen+ |
| RAM | 32 GB+ |
| Storage | 40 GB free |
| GPU | Apple Silicon (16GB+ unified) / NVIDIA RTX 3060+ (8GB VRAM) |
| OS | macOS 14+ / Ubuntu 22.04+ |

> With recommended specs, all AI models run comfortably including Qwen2.5-14B.

## Architecture

```
[Opinion Crawlers]                 [Cloudflare]
 ├─ Naver Blog (Search API)       ├─ Pages (React Dashboard)
 ├─ DCInside (BeautifulSoup)      └─ Tunnel (FastAPI Proxy)
 └─ Cheonan City (BeautifulSoup)        ↑
        │                           [FastAPI]
[Review Crawlers]                       ↑
 ├─ Naver Place (Selenium)        [Analysis Results]
 └─ KakaoMap (Selenium)                 ↑
        │                    [Analysis Pipeline (Sequential)]
        ▼                        ├─ KcELECTRA (Sentiment)
   [PostgreSQL] ────────────→    ├─ BERTopic (Topics)
                                 ├─ KeyBERT (Keywords)
                                 └─ Qwen2.5 via Ollama (Summary)
```

## Project Structure

```
software_engineering/
├── crawler/            # Data collection modules
│   ├── naver_blog.py
│   ├── dcinside.py
│   ├── cheonan_city.py
│   ├── naver_place.py
│   └── kakao_map.py
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

## License

This project is for educational purposes only.

---

# 천안 지역 커뮤니티 감성 분석 대시보드

천안 지역 온라인 커뮤니티 게시글과 맛집/카페 리뷰를 수집하고, AI 기반 감성 분석을 수행하여 지역 여론 동향 및 맛집/카페 추천을 시각화하는 웹 대시보드입니다.

> 소프트웨어 공학 수업 프로젝트

## 개요

네이버 블로그, 디시인사이드 천안갤, 천안시청 시민소통 게시판에서 천안 관련 게시글을, 네이버 플레이스와 카카오맵에서 맛집/카페 리뷰를 크롤링합니다. 로컬에서 실행되는 AI 모델로 감성 및 토픽을 분석한 뒤, 인터랙티브 웹 대시보드로 결과를 제공합니다.

## 주요 기능

### 지역 여론 분석 (메인)
- **데이터 수집** — 네이버 블로그, 디시인사이드 천안갤, 천안시청 시민소통 자동 크롤링
- **감성 분석** — KcELECTRA 기반 긍정/부정/중립 분류
- **토픽 모델링** — BERTopic + 한국어 SBERT로 자동 주제 발견
- **키워드 추출** — KeyBERT를 활용한 문서별 핵심 키워드 추출
- **주간 요약** — Qwen2.5-14B (Ollama)로 AI 이슈 요약 생성
- **인터랙티브 대시보드** — 감성 추이, 토픽 분석, 워드클라우드, 소스별 비교 차트

### 맛집/카페 추천 (서브)
- **멀티 플랫폼 리뷰** — 네이버 플레이스 + 카카오맵 리뷰 수집 및 교차 분석
- **감성 기반 랭킹** — 리뷰 감성 점수 기반 맛집/카페 TOP 10
- **카공 카페 추천** — "조용한", "넓은", "콘센트", "와이파이" 등 키워드 필터링
- **지도 시각화** — 카카오맵 API 연동 핀 표시
- **플랫폼 비교** — 같은 가게의 네이버 vs 카카오 감성 비교

## 데이터 소스

### 지역 여론 분석

| 소스 | 역할 | 수집 방식 |
|------|------|-----------|
| 네이버 블로그 | 일상/관광/생활 여론 | 네이버 검색 API |
| 디시인사이드 천안갤 | 익명 솔직 여론 | BeautifulSoup (로그인 불필요) |
| 천안시청 시민소통 | 공식 민원/제안 | BeautifulSoup (공개 게시판) |

### 맛집/카페 리뷰

| 소스 | 역할 | 수집 방식 |
|------|------|-----------|
| 네이버 플레이스 | 리뷰 양 확보, 블로그 리뷰 연동 | Selenium |
| 카카오맵 | 신뢰도 높은 리뷰, 교차 검증 | Selenium |

## 기술 스택

| 영역 | 기술 |
|------|------|
| 크롤링 | Selenium, BeautifulSoup, 네이버 검색 API |
| 자연어 전처리 | konlpy (Mecab) |
| 감성 분석 | KcELECTRA-base (로컬 GPU, ~1GB) |
| 토픽 모델링 | BERTopic + jhgan/ko-sbert-nli |
| 키워드 추출 | KeyBERT + ko-sbert |
| 텍스트 요약 | Qwen2.5-14B-Instruct Q4 (Ollama, ~8-10GB) |
| 백엔드 | FastAPI |
| 프론트엔드 | React + Recharts |
| 데이터베이스 | PostgreSQL |
| 호스팅 | Cloudflare (Tunnel / Pages) |

> 모든 AI 모델은 로컬에서 실행됩니다. 추론을 위한 외부 API 호출이 없습니다. 메모리 경합 방지를 위해 모델은 순차 실행됩니다.

## 시스템 요구사항

### 최소 사양

| 구성 요소 | 사양 |
|-----------|------|
| CPU | Apple M1 / Intel i5 10세대 이상 |
| RAM | 16 GB |
| 저장 공간 | 20 GB 여유 |
| GPU | 불필요 (CPU 추론 가능) |
| OS | macOS 13+ / Ubuntu 22.04+ / Windows 11 (WSL2) |

> 최소 사양에서는 요약 모델을 `Qwen2.5-7B Q4`로 대체하세요.

### 권장 사양

| 구성 요소 | 사양 |
|-----------|------|
| CPU | Apple M 시리즈 (M1 Pro 이상) / Intel i7 12세대+ |
| RAM | 32 GB 이상 |
| 저장 공간 | 40 GB 여유 |
| GPU | Apple Silicon (16GB+ 통합 메모리) / NVIDIA RTX 3060+ (8GB VRAM) |
| OS | macOS 14+ / Ubuntu 22.04+ |

> 권장 사양에서는 Qwen2.5-14B 포함 모든 AI 모델이 원활하게 실행됩니다.

## 아키텍처

```
[여론 크롤러]                       [Cloudflare]
 ├─ 네이버 블로그 (검색 API)       ├─ Pages (React 대시보드)
 ├─ 디시인사이드 (BeautifulSoup)   └─ Tunnel (FastAPI 프록시)
 └─ 천안시청 (BeautifulSoup)             ↑
        │                           [FastAPI]
[리뷰 크롤러]                           ↑
 ├─ 네이버 플레이스 (Selenium)     [분석 결과]
 └─ 카카오맵 (Selenium)                 ↑
        │                    [분석 파이프라인 (순차 실행)]
        ▼                        ├─ KcELECTRA (감성 분석)
   [PostgreSQL] ────────────→    ├─ BERTopic (토픽 분류)
                                 ├─ KeyBERT (키워드 추출)
                                 └─ Qwen2.5 via Ollama (요약)
```

## 프로젝트 구조

```
software_engineering/
├── crawler/            # 데이터 수집 모듈
│   ├── naver_blog.py
│   ├── dcinside.py
│   ├── cheonan_city.py
│   ├── naver_place.py
│   └── kakao_map.py
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

## 라이선스

이 프로젝트는 교육 목적으로만 사용됩니다.
