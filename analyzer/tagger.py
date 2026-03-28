"""블로그 리뷰 키워드 패턴 매칭으로 장소 태그 추출"""

TAG_PATTERNS: dict[str, list[str]] = {
    "카공": ["작업", "콘센트", "와이파이", "wifi", "공부", "노트북", "스터디"],
    "데이트": ["분위기", "데이트", "커플", "연인", "로맨틱", "뷰"],
    "단체석": ["단체", "모임", "대형 테이블", "회식", "단체석", "넓은"],
    "가족": ["아이", "유아", "키즈", "가족", "아기", "어린이", "아이들"],
    "가성비": ["가성비", "저렴", "학생", "싸다", "착한 가격", "합리적"],
    "조용한": ["조용", "한적", "여유", "힐링", "고즈넉"],
    "노키즈존": ["노키즈존", "노키즈", "no kids"],
    "키즈시설": ["키즈존", "놀이방", "유아의자", "키즈카페", "아이 놀"],
}


class PlaceTagger:
    """리뷰 텍스트에서 장소 태그 추출"""

    def tag_reviews(self, review_texts: list[str]) -> dict[str, float]:
        """여러 리뷰를 분석하여 태그별 confidence 반환"""
        if not review_texts:
            return {}

        tag_counts: dict[str, int] = {tag: 0 for tag in TAG_PATTERNS}
        total_reviews = len(review_texts)

        for text in review_texts:
            text_lower = text.lower()
            for tag, keywords in TAG_PATTERNS.items():
                if any(kw in text_lower for kw in keywords):
                    tag_counts[tag] += 1

        # confidence = 해당 키워드가 등장한 리뷰 비율
        results: dict[str, float] = {}
        for tag, count in tag_counts.items():
            if count > 0:
                confidence = round(count / total_reviews, 2)
                results[tag] = confidence

        return results
