from bertopic import BERTopic
from sentence_transformers import SentenceTransformer

# 한국어 SBERT 모델
EMBEDDING_MODEL = "jhgan/ko-sbert-nli"


class TopicModeler:
    """BERTopic 기반 토픽 모델링"""

    def __init__(self, embedding_model: str = EMBEDDING_MODEL):
        self._embedding_model_name = embedding_model
        self._model = None

    def _load_model(self) -> None:
        if self._model is None:
            embedding_model = SentenceTransformer(self._embedding_model_name)
            self._model = BERTopic(
                embedding_model=embedding_model,
                language="multilingual",
                min_topic_size=5,
            )

    def fit_transform(self, texts: list[str]) -> tuple[list[int], dict[int, str]]:
        """토픽 학습 + 할당 → (토픽 ID 리스트, {토픽ID: 대표 키워드}})"""
        self._load_model()
        topics, _ = self._model.fit_transform(texts)

        # 토픽별 대표 키워드 추출
        topic_labels = {}
        topic_info = self._model.get_topic_info()
        for _, row in topic_info.iterrows():
            tid = row["Topic"]
            if tid == -1:
                topic_labels[tid] = "기타"
                continue
            top_words = self._model.get_topic(tid)
            if top_words:
                topic_labels[tid] = ", ".join([w for w, _ in top_words[:3]])

        return topics, topic_labels

    def get_topic_label(self, topic_id: int) -> str:
        """특정 토픽의 대표 키워드 반환"""
        if self._model is None:
            return "unknown"
        if topic_id == -1:
            return "기타"
        top_words = self._model.get_topic(topic_id)
        if top_words:
            return ", ".join([w for w, _ in top_words[:3]])
        return "unknown"
