import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator


# ------------------------------------------------------------------ #
# Requests                                                             #
# ------------------------------------------------------------------ #

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: Literal["creator", "brand"]
    # Creator registration requires display_name; brand requires brand_name.
    # We accept both as optional here and validate in service.
    display_name: str | None = None   # required when role=creator
    brand_name: str | None = None     # required when role=brand

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ------------------------------------------------------------------ #
# Responses                                                            #
# ------------------------------------------------------------------ #

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
