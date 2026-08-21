from pydantic import BaseModel, ConfigDict, Field


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=3, max_length=320)
    phone_number: str | None = Field(default=None, max_length=32)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(BaseModel):
    id: str
    full_name: str
    email: str
    phone_number: str | None = None
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
