import json
import urllib.request
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db

bearer_scheme = HTTPBearer()

ALGORITHM = "HS256"

_jwks = None

def get_jwks():
    global _jwks
    if _jwks is None and settings.clerk_issuer_url:
        jwks_url = f"{settings.clerk_issuer_url.rstrip('/')}/.well-known/jwks.json"
        try:
            with urllib.request.urlopen(jwks_url) as response:
                _jwks = json.loads(response.read().decode())
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to fetch JWKS")
    return _jwks

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Decode the JWT Bearer token and return the User ORM object.
    Supports both Clerk RS256 JWTs (if clerk_issuer_url is set) and local HS256 JWTs.
    Raises 401 if token is missing, invalid, or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = credentials.credentials
    
    # Import here to avoid circular dependency at module load time
    from app.auth.models import User  # noqa: PLC0415

    try:
        if settings.clerk_issuer_url:
            # Clerk JWT Verification
            jwks = get_jwks()
            payload = jwt.decode(
                token,
                key=jwks,
                algorithms=["RS256"],
                issuer=settings.clerk_issuer_url,
                options={"verify_aud": False}
            )
            clerk_id = payload.get("sub")
            if not clerk_id:
                raise credentials_exception
                
            result = await db.execute(select(User).where(User.clerk_id == clerk_id))
            user = result.scalar_one_or_none()

            # Lazy create user if webhook hasn't fired yet (e.g. after a DB reset in dev)
            if not user:
                email = f"{clerk_id}@placeholder.local"
                role = "creator"

                # Pull real data from Clerk so the row is usable immediately
                if settings.clerk_secret_key:
                    try:
                        req = urllib.request.Request(
                            f"https://api.clerk.com/v1/users/{clerk_id}",
                            headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
                        )
                        with urllib.request.urlopen(req) as resp:
                            clerk_user = json.loads(resp.read().decode())
                        emails = clerk_user.get("email_addresses", [])
                        primary_id = clerk_user.get("primary_email_address_id")
                        real_email = next(
                            (e["email_address"] for e in emails if e["id"] == primary_id), None
                        )
                        if real_email:
                            email = real_email
                        meta_role = clerk_user.get("public_metadata", {}).get("role", "creator")
                        if meta_role in ("creator", "brand", "admin"):
                            role = meta_role
                    except Exception:
                        pass  # fall back to placeholder if Clerk API is unreachable

                user = User(
                    email=email,
                    password_hash=None,
                    clerk_id=clerk_id,
                    role=role,
                    is_email_verified=True,
                    is_active=True,
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
        else:
            # Local JWT Verification
            payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
            user_id = payload.get("sub")
            if not user_id:
                raise credentials_exception
                
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            
    except JWTError:
        raise credentials_exception

    if user is None or not user.is_active:
        raise credentials_exception
    return user


async def require_admin(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    current_user=Depends(get_current_user),
):
    role = None
    if settings.clerk_issuer_url:
        try:
            jwks = get_jwks()
            claims = jwt.decode(
                credentials.credentials,
                key=jwks,
                algorithms=["RS256"],
                issuer=settings.clerk_issuer_url,
                options={"verify_aud": False},
            )
            role = claims.get("metadata", {}).get("role")
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
    else:
        role = getattr(current_user, "role", None)
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
