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

    user.strava_id = strava_id
    user.strava_access_token = access_token
    db.commit()

    return RedirectResponse(url="http://localhost:5173/strava-redirect")