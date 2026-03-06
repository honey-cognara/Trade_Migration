from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.utils.auth import decode_access_token
from backend.db.setup import get_db
from backend.db.models.models import User

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    print(f"\n[DEBUG] get_current_user invoked! Token length: {len(token) if token else 0}")
    try:
        payload = decode_access_token(token)
        user_id = payload.get("user_id")
        print(f"[DEBUG] Decoded payload user_id: {user_id}")
    except Exception as e:
        print(f"[DEBUG] Decode exception: {e}")
        raise
        
    if not user_id:
        print("[DEBUG] No user_id in payload, raising 401")
        raise HTTPException(status_code=401, detail="Invalid token payload")
        
    try:
        import uuid
        uid = uuid.UUID(user_id)
        print(f"[DEBUG] Cast to UUID: {uid}")
    except ValueError:
        print("[DEBUG] Invalid UUID format, raising 401")
        raise HTTPException(status_code=401, detail="Invalid user ID format in token")
        
    print(f"[DEBUG] Querying database for user: {uid}")
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    print(f"[DEBUG] Query result: {user}")
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account is inactive")
    return user


def require_roles(*roles):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required roles: {', '.join(roles)}"
            )
        return current_user
    return role_checker
