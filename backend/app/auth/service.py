from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import jwt
import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.schemas import RegisterRequest
from app.config import settings
from app.common.dependencies import ALGORITHM


# ------------------------------------------------------------------ #
# Password helpers                                                     #
# ------------------------------------------------------------------ #

def hash_password(plain: str) -> str:
    pwd_bytes = plain.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False



# ------------------------------------------------------------------ #
# JWT                                                                  #
# ------------------------------------------------------------------ #

def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


# ------------------------------------------------------------------ #
# User queries                                                         #
# ------------------------------------------------------------------ #

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(
        select(User).where(User.email == email, User.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()


# ------------------------------------------------------------------ #
# Registration                                                         #
# ------------------------------------------------------------------ #

async def register_user(db: AsyncSession, data: RegisterRequest) -> tuple[User, str]:
    """
    Create a User row and the corresponding profile row.
    Returns (user, access_token).
    """
    # Validate role-specific fields
    if data.role == "creator" and not data.display_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="display_name is required for creator registration",
        )
    if data.role == "brand" and not data.brand_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="brand_name is required for brand registration",
        )

    # Check duplicate email
    existing = await get_user_by_email(db, str(data.email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Create user
    user = User(
        email=str(data.email),
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    await db.flush()  # get user.id without committing

    # Create downstream profile
    if data.role == "creator":
        from app.creators.service import create_creator_profile  # noqa: PLC0415
        await create_creator_profile(db, user_id=user.id, display_name=data.display_name)  # type: ignore[arg-type]
    elif data.role == "brand":
        from app.brands.service import create_brand_profile  # noqa: PLC0415
        await create_brand_profile(db, user_id=user.id, brand_name=data.brand_name)  # type: ignore[arg-type]

    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id), user.role)
    return user, token


# ------------------------------------------------------------------ #
# Login                                                                #
# ------------------------------------------------------------------ #

async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return user
