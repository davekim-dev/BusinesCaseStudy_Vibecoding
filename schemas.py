from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

MAX_LENGTH = 1000


# 요청 입력
class SummaryRequest(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def check_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("내용을 입력해 주세요.")
        if len(value) > MAX_LENGTH:
            raise ValueError(f"{MAX_LENGTH}자 이하로 입력해 주세요.")
        return value


# AI 응답 (육하원칙 6개 키)
class FiveWOneH(BaseModel):
    model_config = ConfigDict(extra="forbid")

    who: str
    when: str
    where: str
    what: str
    how: str
    why: str


# API 응답: 히스토리 목록 항목
class HistoryItem(BaseModel):
    id: int
    created_at: datetime
    preview: str
    status: str


# API 응답: 원문 + 결과
class SummaryDetail(BaseModel):
    id: int
    created_at: datetime
    status: str
    original_text: str
    result: Optional[FiveWOneH]
