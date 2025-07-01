from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session, select
from app.models import User
from app.auth_helpers import get_current_user
from app.database import get_session
from app.utils import verify_password, hash_password
from pydantic import BaseModel
import shutil
import os

router = APIRouter()


UPLOAD_DIR = "uploads/profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class NameUpdate(BaseModel):
    name: str

class EmailUpdate(BaseModel):
    email: str

class ImageUpdate(BaseModel):
    profile_img_url: str

class PasswordUpdateRequest(BaseModel):
    old_password: str
    new_password: str

@router.put("/update_name", response_model=dict)
def update_name(
    payload: NameUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    user = db.exec(select(User).where(User.id == current_user.id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")

    user.name = payload.name
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "Nome aggiornato con successo", "new_name": user.name}

@router.put("/update_email", response_model=dict)
def update_email(
    payload: EmailUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    user = db.exec(select(User).where(User.id == current_user.id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    print("New email: {payload.email}") 
    user.email = payload.email
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "Nome aggiornato con successo", "new_email": user.email}


@router.post("/upload_image")
def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    filename = f"{current_user.id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"filename": "profiles/" + filename}


@router.put("/update_image", response_model=dict)
def update_image(
    payload: ImageUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    user = db.exec(select(User).where(User.id == current_user.id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    user.profile_img_url = payload.profile_img_url
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "Nome aggiornato con successo", "new_image": user.profile_img_url}


@router.put("/update_password")
def update_password(
    request: PasswordUpdateRequest,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    user = db.exec(select(User).where(User.id == current_user.id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")

    if not verify_password(request.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="La vecchia password non è corretta")

    user.hashed_password = hash_password(request.new_password)
    db.add(user)
    db.commit()

    return {"msg": "Password aggiornata con successo"}