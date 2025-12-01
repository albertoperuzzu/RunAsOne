from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlmodel import select
from app.models import User, UserCreate
from app.utils import hash_password, verify_password
from app.database import engine, create_db_and_tables, get_session
from fastapi.middleware.cors import CORSMiddleware
from app.strava_auth import router as auth_router
from app.strava_api import router as strava_router
from app.db_search import router as db_router
from app.invites import router as invites_router
from app.profile import router as profile_router
from app.db_search import UPLOAD_DIR
from sqlalchemy.orm import Session
from jose import jwt
import os
from app.auth_helpers import SECRET_KEY, ALGORITHM
import logging

app = FastAPI(debug=True)
create_db_and_tables()
os.makedirs("uploads", exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://runasone.onrender.com",
    "https://runasone-backend.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================
# API
# ===========================
@app.post("/register")
def register(user_input: UserCreate, session=Depends(get_session)):
    existing_user = session.exec(
        select(User).where(User.email == user_input.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email già registrata.")

    new_user = User(
        email=user_input.email,
        name=user_input.name,
        hashed_password=hash_password(user_input.password)
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {"id": new_user.id, "email": new_user.email, "nickname": new_user.name}


@app.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_session)):
    user = db.exec(select(User).where(User.email == form.username)).first()
    if not user or verify_password(form.password, user.hashed_password) is False:
        raise HTTPException(status_code=401, detail="Credenziali errate")
    token = jwt.encode({"user_id": user.id}, SECRET_KEY, algorithm=ALGORITHM)
    return {
        "access_token": token,
        "token_type": "bearer",
        "nickname": user.name,
        "profile_img_url": user.profile_img_url,
    }


app.include_router(auth_router, prefix="")
app.include_router(strava_router, prefix="/strava_api")
app.include_router(db_router, prefix="/db")
app.include_router(invites_router, prefix="/handle_invites")
app.include_router(profile_router, prefix="/handle_profile")

# ===========================
# SERVE FRONTEND SOLO IN PRODUZIONE
# ===========================
if os.getenv("RENDER") == "true":

    from fastapi.responses import FileResponse
    
    frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

    # app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, "assets")), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    async def spa_fallback(path: str):
        return FileResponse(os.path.join(frontend_dir, "index.html"))