from fastapi import HTTPException
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.models import Activity

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "supersegreto"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token non valido")

def save_activities(filtered: list, user_id: int, db: Session):
    for act in filtered:
        strava_id = act["id"]
        existing = db.exec(
            select(Activity).where(
                Activity.strava_id == strava_id,
                Activity.user_id == user_id
            )
        ).first()

        if not existing:
            new_activity = Activity(
                strava_id=strava_id,
                name=act["name"],
                distance=act["distance"],
                user_id=user_id
            )
            db.add(new_activity)
    db.commit()