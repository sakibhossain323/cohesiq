from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import service
from app.auth.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.auth.models import User
from app.common.dependencies import get_current_user, get_db

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    data: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Register a new creator or brand account. Returns a JWT on success."""
    user, token = await service.register_user(db, data)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Authenticate and return a JWT access token."""
    user = await service.authenticate_user(db, str(data.email), data.password)
    token = service.create_access_token(str(user.id), user.role)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
async def me(current_user: Annotated[User, Depends(get_current_user)]):
    """Return the currently authenticated user's info."""
    return current_user
