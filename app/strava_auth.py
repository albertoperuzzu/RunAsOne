from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
import os
import httpx
from urllib.parse import urlencode
from dotenv import load_dotenv
from sqlmodel import Session
from app.auth_helpers import get_current_user
from app.database import get_session
from app.models import User
from app.utils import verify_token
import time
import requests

load_dotenv()

router = APIRouter()

CLIENT_ID = os.getenv("STRAVA_CLIENT_ID")
CLIENT_SECRET = os.getenv("STRAVA_CLIENT_SECRET")
REDIRECT_URI = os.getenv("STRAVA_REDIRECT_URI")

@router.get("/strava_login")
def login(token: str):
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "activity:read_all",
        "state": token
    }
    return RedirectResponse(f"https://www.strava.com/oauth/authorize?{urlencode(params)}")


@router.get("/callback")
async def callback(
    request: Request,
    db: Session = Depends(get_session),
):
    code = request.query_params.get("code")
    state = request.query_params.get("state")

    if not state:
        raise HTTPException(status_code=400, detail="Missing state parameter")

    try:
        payload = verify_token(state) 
        user_id = payload.get("user_id")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token in state parameter")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    async with httpx.AsyncClient() as client:
        response = await client.post("https://www.strava.com/oauth/token", data={
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code"
        })

        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Strava token exchange failed")

        data = response.json()
        strava_id = data["athlete"]["id"]
        access_token = data["access_token"]
        refresh_token = data["refresh_token"]
        expires_at = data["expires_at"]

    user.strava_id = strava_id
    user.strava_access_token = access_token
    user.strava_refresh_token = refresh_token
    user.strava_token_expires_at = expires_at
    user.strava_connected = True
    db.commit()

    if os.getenv("RENDER") == "true":
        return RedirectResponse(url="https://runasone.onrender.com/strava-redirect")

    return RedirectResponse(url="http://localhost:5173/strava-redirect")


def get_valid_strava_token(user, session):
    now = int(time.time())

    # Token valido
    if user.strava_token_expires_at and user.strava_token_expires_at > now:
        return user.strava_access_token

    # Token scaduto
    response = requests.post(
        "https://www.strava.com/oauth/token",
        data={
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "grant_type": "refresh_token",
            "refresh_token": user.strava_refresh_token,
        }
    ).json()

    # Aggiorna DB
    user.strava_access_token = response["access_token"]
    user.strava_refresh_token = response["refresh_token"]
    user.strava_token_expires_at = response["expires_at"]
    
    session.add(user)
    session.commit()

    return user.strava_access_token