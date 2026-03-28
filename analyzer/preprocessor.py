import os
import re

# mecab-ko 설정 파일 경로 (Homebrew Apple Silicon)
if not os.environ.get("MECABRC"):
    mecabrc = "/opt/homebrew/etc/mecabrc"
    if os.path.exists(mecabrc):
        os.environ["MECABRC"] = mecabrc

from konlpy.tag import Mecab

# 불용어 리스트
STOPWORDS = {
    "의", "가", "이", "은", "들", "는", "좀", "잘", "걍", "과",
    "도", "를", "으로", "자", "에", "와", "한", "하다", "을",
    "에서", "에게", "까지", "부터", "으로", "로", "에게서",
    "것", "수", "등", "때", "년", "월", "일", "그", "저", "이",
    "및", "더", "약", "또", "중", "위", "아", "휴", "뭐",
}

# HTML 태그, URL, 특수문자 패턴
HTML_PATTERN = re.compile(r"<[^>]+>")
URL_PATTERN = re.compile(r"https?://\S+")
SPECIAL_CHAR_PATTERN = re.compile(r"[^\w\s가-힣]")
WHITESPACE_PATTERN = re.compile(r"\s+")


class TextPreprocessor:
    """한국어 텍스트 전처리"""

    def __init__(self):
        self._mecab = None

    @property
    def mecab(self) -> Mecab:
        if self._mecab is None:
            self._mecab = Mecab(dicpath="/opt/homebrew/lib/mecab/dic/mecab-ko-dic")
        return self._mecab

    def clean(self, text: str) -> str:
        """기본 정제 (HTML, URL, 특수문자 제거)"""
        text = HTML_PATTERN.sub("", text)
        text = URL_PATTERN.sub("", text)
        text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
        text = text.replace("&quot;", '"').replace("&#39;", "'")
        text = SPECIAL_CHAR_PATTERN.sub(" ", text)
        text = WHITESPACE_PATTERN.sub(" ", text)
        return text.strip()

    def tokenize(self, text: str) -> list[str]:
        """형태소 분석 후 명사/동사/형용사만 추출"""
        pos_tags = self.mecab.pos(text)
        tokens = []
        for word, tag in pos_tags:
            # 명사(NN*), 동사(VV), 형용사(VA)만
            if tag.startswith(("NN", "VV", "VA")) and len(word) > 1:
                if word not in STOPWORDS:
                    tokens.append(word)
        return tokens

    def process(self, text: str) -> str:
        """정제 + 토큰화 → 공백 구분 문자열"""
        cleaned = self.clean(text)
        tokens = self.tokenize(cleaned)
        return " ".join(tokens)
