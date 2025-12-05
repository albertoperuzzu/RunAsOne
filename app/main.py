from fastapi import FastAPI, Depends, HTTPException, Response, status, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
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
from app.auth_helpers import create_access_token, create_refresh_token, verify_token, is_refresh_token, REFRESH_TOKEN_EXPIRE_DAYS
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

    access_token = create_access_token({"user_id": user.id})
    refresh_token = create_refresh_token({"user_id": user.id})

    response_body = {
        "access_token": access_token,
        "token_type": "bearer",
        "nickname": user.name,
        "profile_img_url": user.profile_img_url,
        "strava_connected": bool(user.strava_access_token)
    }

    response = JSONResponse(content=response_body)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=os.getenv("RENDER") == "true",
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/"
    )

    return response


@app.get("/me")
def me(
    authorization: str | None = None,
    refresh_token: str | None = Cookie(default=None),
    db = Depends(get_session)
):
    user_id = None

    # Tenta con access token
    if authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer" and token:
            try:
                payload = verify_token(token)
                user_id = payload.get("user_id")
            except Exception:
                # token scaduto
                pass

    # Access token non valido -> tenta refresh token
    if not user_id and refresh_token:
        try:
            payload = verify_token(refresh_token)
            if not is_refresh_token(payload):
                raise Exception("Invalid refresh token")
            user_id = payload.get("user_id")
        except Exception:
            raise HTTPException(status_code=401, detail="Not authenticated")

    # Nessun token valido
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = db.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Se è entrato tramite refresh token, genera un nuovo access token
    new_access_token = None
    if authorization is None: 
        new_access_token = create_access_token({"user_id": user_id})

    return {
        "user_id": user.id,
        "email": user.email,
        "nickname": user.name,
        "profile_img_url": user.profile_img_url,
        "strava_connected": bool(user.strava_access_token),
        "new_access_token": new_access_token
    }


@app.post("/refresh")
def refresh_token_endpoint(refresh_token: str | None = Cookie(default=None), db_session: Session = Depends(get_session)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")
    try:
        payload = verify_token(refresh_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if not is_refresh_token(payload):
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("user_id")
    # controlla che l'utente esista:
    user = db_session.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_access = create_access_token({"user_id": user_id})
    return {"access_token": new_access, "token_type": "bearer", "nickname": user.name, "profile_img_url": user.profile_img_url, "strava_connected": bool(user.strava_access_token)}


@app.post("/logout")
def logout():
    resp = JSONResponse(content={"msg": "logged out"})
    resp.delete_cookie("refresh_token", path="/")
    return resp


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
    public_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "public")

    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, "assets")), name="assets")
    app.mount("/public", StaticFiles(directory=public_dir), name="public")

    @app.get("/privacy.html", include_in_schema=False)
    async def serve_privacy():
        return FileResponse(os.path.join(frontend_dir, "privacy.html"))

    @app.get("/terms.html", include_in_schema=False)
    async def serve_terms():
        return FileResponse(os.path.join(frontend_dir, "terms.html"))

    @app.get("/{path:path}", include_in_schema=False)
    async def spa_fallback(path: str):
        return FileResponse(os.path.join(frontend_dir, "index.html"))