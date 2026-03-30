<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# pages

## Purpose
천안 지역 생활 정보 제공 애플리케이션의 모든 페이지 컴포넌트. 대시보드, 맛집/카페, 관광/명소, 청년, 대학생, 채용, 가족(부동산) 정보 등 각 주제별 페이지와 스타일을 관리합니다.

## Key Files
| File | Description |
|------|-------------|
| `DashboardPage.jsx` | 메인 대시보드 - 감성 분포 파이차트, 트렌드 라인차트, 소스별 바차트, 주요 키워드 워드클라우드, 주간 토픽/행사, 주간 요약, 최근 게시글 테이블 |
| `DashboardPage.css` | 그리드 레이아웃(2열), 차트 컨테이너, 감성 뱃지, 키워드 태그, 광고 필터링 스타일 |
| `PlacesPage.jsx` | 천안 맛집/카페 - 전체 목록/감성 랭킹/지도 탭, 카테고리 필터, 영업중 토글, 장소 카드, 상세 모달 (리뷰/감성 바/미니맵), Kakao Maps API |
| `PlacesPage.css` | 카드 그리드, 랭킹 뱃지, 감성 양방향 바, 모달 오버레이, Kakao 지도 스타일 |
| `EventsPage.jsx` | 천안 관광/명소/행사 - 축제와 관광지 분리 표시, 카테고리 필터, 이벤트 카드 |
| `EventsPage.css` | 이벤트 카드, 축제 태그 강조, 섹션 제목 스타일 |
| `YouthPage.jsx` | 청년 대학 공지 - 대학 선택(단국대/호서대/백석대), 카테고리 필터(입학/공모전/장학금/일반), 공지 테이블, 청년 맛집 추천 섹션 |
| `YouthPage.css` | 필터바, 공지 테이블, 맛집 섹션, 배지 스타일 |
| `CollegePage.jsx` | 대학생 정보 - 탭(공모전/장학금/주거), 각 탭별 카드/테이블 렌더링, 대학생 맛집 추천 섹션 |
| `CollegePage.css` | 탭바, 카드 그리드, 주거 데이터 테이블, 거래 유형 뱃지 |
| `FamilyPage.jsx` | 가족(부동산) 정보 - 매물유형(아파트/빌라/오피스텔 등)/거래유형(매매/전세/월세) 필터, 부동산 테이블, 가족 맛집 추천 섹션 |
| `FamilyPage.css` | 부동산 테이블, 거래 뱃지(색상 구분), 가격 포맷팅(억원/만원), 맛집 섹션 |
| `JobsPage.jsx` | 채용 정보 - 경력 수준(신입/주니어/미드/시니어) 필터, 직종(IT/디자인/마케팅 등) 필터, 채용 카드, 페이지네이션 |
| `JobsPage.css` | 채용 카드 레이아웃, 직무 태그(위치/급여/경력), 지원하기 버튼, 페이지네이션 |

## For AI Agents

### Working In This Directory
각 페이지 컴포넌트는 독립적인 상태 관리와 API 호출을 수행합니다. 새로운 페이지 추가 시:
1. `api` import로 백엔드 호출: `api.get('/api/...')`, `api.get('/api/.../...', { params })`
2. `useCallback` + `useEffect`로 필터/페이지네이션 의존성 관리
3. 에러/로딩 상태 분리: 각각 `error`, `loading` 상태 유지
4. 모든 페이지는 "타이틀 + 필터바 + 콘텐츠 + (선택사항) 맛집 섹션" 구조
5. 페이지별 CSS는 별도 파일로 분리 (BEM 스타일 클래싱)

### Common Patterns
- **필터링**: 필터값 변경 시 페이지를 1로 리셋하고 `fetchData()` 호출
- **페이지네이션**: `page` 상태로 관리, "이전/다음" 버튼 disabled 처리
- **에러 처리**: try-catch에서 에러 메시지 설정, 사용자에게 표시
- **맛집 추천**: 대학생/청년/가족 페이지는 해당 age_group의 맛집 6개 추천 섹션 포함
- **날짜 포맷**: `dateStr?.slice(0, 10)` 또는 `new Date(dateStr).toLocaleDateString('ko-KR')`
- **가격 포맷**: 원화(원)/만원/억원 단위 자동 변환
- **감성 뱃지**: 긍정/부정/중립 색상 구분 (DashboardPage 참조)
- **모달**: PlacesPage의 PlaceDetailModal - ESC 키 닫기, 배경 클릭 닫기, body overflow 잠금

## Dependencies

### Internal
- `../api/client`: axios 인스턴스 (모든 API 호출)

### External
- React: useState, useEffect, useCallback, useRef (for PlacesPage modal, map ref)
- React Router: (Layout에서만 - pages는 data fetching만)
- recharts: PieChart, LineChart, BarChart, ResponsiveContainer (DashboardPage만)
- Kakao Maps API: 지도 렌더링 (PlacesPage의 KakaoMap 컴포넌트와 PlaceDetailModal의 미니맵)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
