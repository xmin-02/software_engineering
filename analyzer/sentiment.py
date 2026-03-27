import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# 한국어 감성 분석 사전학습 모델 (11개 감정 → 3분류 매핑)
MODEL_NAME = "nlp04/korean_sentiment_analysis_kcelectra"

# 모델 라벨 → sentiment 매핑
LABEL_MAP = {
    0: "positive",   # 기쁨(행복한)
    1: "positive",   # 고마운
    2: "positive",   # 설레는(기대하는)
    3: "positive",   # 사랑하는
    4: "positive",   # 즐거운(신나는)
    5: "neutral",    # 일상적인
    6: "neutral",    # 생각이 많은
    7: "negative",   # 슬픔(우울한)
    8: "negative",   # 힘듦(지침)
    9: "negative",   # 짜증남
    10: "negative",  # 걱정스러운(불안한)
}

ID2LABEL = {
    0: "기쁨(행복한)", 1: "고마운", 2: "설레는(기대하는)", 3: "사랑하는",
    4: "즐거운(신나는)", 5: "일상적인", 6: "생각이 많은", 7: "슬픔(우울한)",
    8: "힘듦(지침)", 9: "짜증남", 10: "걱정스러운(불안한)",
}


class SentimentAnalyzer:
    """KcELECTRA 기반 한국어 감성 분석"""

    def __init__(self, model_name: str = MODEL_NAME):
        self.model_name = model_name
        self._tokenizer = None
        self._model = None

    def _load_model(self) -> None:
        """모델 지연 로드"""
        if self._tokenizer is None:
            self._tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self._model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self._model.eval()

    def analyze(self, text: str) -> dict:
        """텍스트 감성 분석 → sentiment, score 반환"""
        self._load_model()

        inputs = self._tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True,
        )

        with torch.no_grad():
            outputs = self._model(**inputs)

        probs = torch.softmax(outputs.logits, dim=-1)[0]
        pred_idx = torch.argmax(probs).item()
        score = probs[pred_idx].item()

        sentiment = LABEL_MAP[pred_idx]
        emotion = ID2LABEL[pred_idx]

        # 신뢰도 낮으면 중립 처리
        if score < 0.6:
            sentiment = "neutral"

        return {
            "sentiment": sentiment,
            "emotion": emotion,
            "sentiment_score": round(score, 4),
        }

    def analyze_batch(self, texts: list[str]) -> list[dict]:
        """배치 분석"""
        return [self.analyze(text) for text in texts]
