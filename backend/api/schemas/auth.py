from pydantic import BaseModel, EmailStr, field_validator, Field
from enum import Enum
import re


class UserRole(str, Enum):
    candidate = "candidate"
    employer = "employer"
    admin = "admin"
    company_admin = "company_admin"
    migration_agent = "migration_agent"
    training_provider = "training_provider"


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120, description="Full name")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        return v

    @field_validator("name")
    @classmethod
    def name_no_script(cls, v: str) -> str:
        # Basic XSS guard on name field
        stripped = v.strip()
        if not stripped:
            raise ValueError("Name cannot be blank.")
        return stripped


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    email: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    status: str
    model_config = {"from_attributes": True}


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyResetOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        return v
