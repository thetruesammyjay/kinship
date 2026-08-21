from pydantic import BaseModel, Field, field_validator


class SusSubmission(BaseModel):
    responses: list[int] = Field(min_length=10, max_length=10)

    @field_validator("responses")
    @classmethod
    def validate_responses(cls, responses: list[int]) -> list[int]:
        if any(response < 1 or response > 5 for response in responses):
            raise ValueError("Each SUS response must be between 1 and 5")
        return responses


class SusSubmissionRead(BaseModel):
    score: float
    interpretation: str
