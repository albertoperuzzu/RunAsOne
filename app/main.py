from fastapi import FastAPI
from fastapi import Depends
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select
from app.models import User
from app.utils import hash_password, verify_password, create_access_token
from app.database import engine, create_db_and_tables, get_session
from fastapi.middleware.cors import CORSMiddleware
from app.auth import router as auth_router
from app.strava_api import router as strava_router

app = FastAPI()
create_db_and_tables()

@app.post("/register")
def register(user_input: User, session=Depends(get_session)):
    existing_user = session.exec(
        select(User).where(User.email == user_input.email)
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email già registrata.")

    user_input.hashed_password = hash_password(user_input.hashed_password)
    session.add(user_input)
    session.commit()
    session.refresh(user_input)

    return {"id": user_input.id, "email": user_input.email}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session=Depends(get_session)):
    user = session.exec(
        select(User).where(User.email == form_data.username)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Email non trovata.")

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Password errata.")

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="")
app.include_router(strava_router, prefix="/activities")