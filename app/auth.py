from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
import os
import httpx
from urllib.parse import urlencode
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

CLIENT_ID = os.getenv("STRAVA_CLIENT_ID")
CLIENT_SECRET = os.getenv("STRAVA_CLIENT_SECRET")
REDIRECT_URI = os.getenv("STRAVA_REDIRECT_URI")

user_token = {}  # TEMPORARY IN-MEMORY TOKEN


@router.get("/strava_login")
def login():
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "activity:read_all",
    }
    return RedirectResponse(f"https://www.strava.com/oauth/authorize?{urlencode(params)}")


@router.get("/callback")
async def callback(request: Request):
    code = request.query_params.get("code")

    async with httpx.AsyncClient() as client:
        response = await client.post("https://www.strava.com/oauth/token", data={
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code"
        })

        data = response.json()
        user_token["strava_access_token"] = data["access_token"]

    return RedirectResponse(url="http://localhost:5173/strava-redirect")