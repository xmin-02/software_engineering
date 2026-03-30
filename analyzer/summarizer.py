import requests

from backend.config import settings

DEFAULT_MODEL = "qwen2.5:14b-instruct-q4_K_M"
OLLAMA_URL = "http://localhost:11434/api/generate"

SYSTEM_PROMPT = """당신은 천안시 관련 텍스트를 요약하는 전문가입니다.
주어진 텍스트들을 분석하여 핵심 내용을 3-5문장으로 요약해주세요.
- 주요 키워드와 감성(긍정/부정/중립)을 반영
- 천안시 관련 핵심 이슈 중심으로 요약
- 한국어로 작성"""


class TextSummarizer:
    """Ollama(Qwen2.5) 기반 텍스트 요약"""

    def __init__(self, model: str = DEFAULT_MODEL):
        self.model = model
        self.url = settings.ollama_url if hasattr(settings, 'ollama_url') else OLLAMA_URL

    def summarize(self, texts: list[str], context: str = "") -> str:
        """여러 텍스트를 하나의 요약으로 생성"""
        combined = "\n---\n".join(texts[:20])  # 최대 20개
        prompt = f"{context}\n\n아래 텍스트들을 3-5문장으로 요약해주세요:\n\n{combined}"

        try:
            resp = requests.post(
                self.url,
                json={
                    "model": self.model,
                    "system": SYSTEM_PROMPT,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3, "num_predict": 512},
                },
                timeout=120,
            )
            resp.raise_for_status()
            return resp.json().get("response", "").strip()
        except requests.RequestException as e:
            return f"요약 실패: {e}"

    def summarize_by_topic(self, topic_texts: dict[str, list[str]]) -> dict[str, str]:
        """토픽별 요약 생성"""
        summaries = {}
        for topic, texts in topic_texts.items():
            if topic == "기타":
                continue
            context = f"토픽: {topic}"
            summaries[topic] = self.summarize(texts, context)
        return summaries
