from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.auth_helpers import get_current_user
from app.database import get_session
from app.models import User
from pydantic import BaseModel
import garminconnect

router = APIRouter()


class GarminCredentials(BaseModel):
    email: str
    password: str


@router.post("/connect")
def connect_garmin(
    credentials: GarminCredentials,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    try:
        garmin = garminconnect.Garmin(email=credentials.email, password=credentials.password)
        garmin.login()
        session_data = garmin.garth.dumps()
    except garminconnect.GarminConnectAuthenticationError:
        raise HTTPException(status_code=401, detail="Credenziali Garmin non valide. Controlla email e password.")
    except garminconnect.GarminConnectTooManyRequestsError:
        raise HTTPException(
            status_code=429,
            detail="Garmin ha bloccato temporaneamente i tentativi di accesso. Riprova tra 15-30 minuti."
        )
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "Too Many Requests" in error_str:
            raise HTTPException(
                status_code=429,
                detail="Garmin ha bloccato temporaneamente i tentativi di accesso. Riprova tra 15-30 minuti."
            )
        if "401" in error_str or "authentication" in error_str.lower():
            raise HTTPException(status_code=401, detail="Credenziali Garmin non valide.")
        raise HTTPException(status_code=400, detail=f"Errore di connessione a Garmin: {error_str}")

    current_user.garmin_connected = True
    current_user.garmin_session_data = session_data
    db.add(current_user)
    db.commit()
    return {"message": "Account Garmin collegato con successo"}


@router.delete("/disconnect")
def disconnect_garmin(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    current_user.garmin_connected = False
    current_user.garmin_session_data = None
    db.add(current_user)
    db.commit()
    return {"message": "Account Garmin disconnesso"}


def get_garmin_client(user: User) -> garminconnect.Garmin:
    if not user.garmin_session_data:
        raise HTTPException(status_code=401, detail="Account Garmin non collegato")
    try:
        garmin = garminconnect.Garmin()
        garmin.login(tokenstore=user.garmin_session_data)
        return garmin
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Sessione Garmin scaduta. Ricollegare l'account Garmin dal profilo."
        )
