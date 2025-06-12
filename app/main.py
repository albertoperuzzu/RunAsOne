from fastapi import FastAPI
from app.auth import router as auth_router
from app.strava_api import router as strava_router

app = FastAPI()

app.include_router(auth_router, prefix="")
app.include_router(strava_router, prefix="/activities")