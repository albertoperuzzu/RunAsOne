from fastapi import APIRouter
import httpx
from app.auth import user_token

router = APIRouter()


@router.get("/")
async def get_activities():
    access_token = user_token.get("access_token")
    if not access_token:
        return {"error": "Utente non autenticato"}

    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://www.strava.com/api/v3/athlete/activities",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        return res.json()