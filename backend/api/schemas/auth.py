from pydantic import BaseModel, EmailStr
from enum import Enum


class UserRole(str, Enum):
    candidate = "candidate"
    employer = "employer"
    admin = "admin"
    company_admin = "company_admin"
    migration_agent = "migration_agent"
    training_provider = "training_provider"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


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
