from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form
from fastapi.responses import JSONResponse
from app.database import get_session
from app.models import User, Team, UserTeamLink, Activity
from app.custom_beans import TeamStatsResponse
from sqlmodel import Session, select
from app.auth_helpers import get_current_user
import uuid
import shutil
import os
from app.db_utils import (
    get_user_activities,
    get_month_range,
    get_team_total_distance,
    get_team_total_elevation,
    get_leaderboard_sum,
    get_leaderboard_max,
)

router = APIRouter()

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/getDBActivities")
def get_activities(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    return get_user_activities(user_id=current_user.id, db=db)


@router.get("/getTeams")
def get_my_teams(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    user = db.exec(select(User).where(User.id == current_user.id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    teams = user.teams
    result = []
    for team in teams:
        result.append({
            "id": team.id,
            "name": team.name,
            "image_url": team.image_url,
            "members": [{"id": member.id, "email": member.email} for member in team.members]
        })
    return result


@router.get("/teams/{team_id}")
def get_team(
    team_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team non trovato")
    link = db.exec(
        select(UserTeamLink).where(
            UserTeamLink.team_id == team_id,
            UserTeamLink.user_id == current_user.id
        )
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Non sei membro di questo team")
    member_links = db.exec(
        select(UserTeamLink).where(UserTeamLink.team_id == team_id)
    ).all()
    members = []
    activities = []
    for l in member_links:
        user = db.get(User, l.user_id)
        if user:
            profile_img = user.profile_img_url or "/default_user_img.jpg"
            if not profile_img.startswith("/uploads/") and not profile_img.startswith("/"):
                profile_img = f"/uploads/{profile_img}"

            members.append({
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "profile_img_url": profile_img,
                "role": l.role,
                "activities": user.activities
            })

            for a in user.activities:
                activities.append({
                    "id": a.id,
                    "name": a.name,
                    "distance": a.distance,
                    "summary_polyline": a.summary_polyline,
                    "date": a.date
                })

    activities.sort(key=lambda x: x["date"], reverse=True)

    return {
        "id": team.id,
        "name": team.name,
        "image_url": team.image_url,
        "is_admin": link.role == "admin",
        "members": members,
        "activities": activities
    }


@router.post("/create_team")
async def create_team(
    name: str = Form(...),
    image: UploadFile = Form(...),
    db: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    extension = image.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{extension}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        shutil.copyfileobj(image.file, f)

    new_team = Team(name=name, image_url=filename)
    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    link = UserTeamLink(user_id=current_user.id, team_id=new_team.id, role="admin")
    db.add(link)
    db.commit()
    return JSONResponse(status_code=201, content={"message": "Team creato", "team_id": new_team.id})


@router.get("/teams/{team_id}/stats", response_model=TeamStatsResponse)
def get_team_stats(
    team_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verifica che l'utente sia membro del team
    link = db.exec(
        select(UserTeamLink).where(
            UserTeamLink.team_id == team_id,
            UserTeamLink.user_id == current_user.id
        )
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Non sei membro di questo team")

    # Ottieni gli ID dei membri del team
    member_ids = db.exec(
        select(UserTeamLink.user_id).where(UserTeamLink.team_id == team_id)
    ).all()

    # Range del mese corrente
    start_month, end_month = get_month_range()

    # Statistiche totali
    total_distance = get_team_total_distance(db, member_ids, start_month, end_month)
    total_elevation = get_team_total_elevation(db, member_ids, start_month, end_month)

    # Leaderboards (top 3)
    distance_lb = get_leaderboard_sum(db, member_ids, Activity.distance, start_month, end_month)
    elevation_lb = get_leaderboard_sum(db, member_ids, Activity.elevation, start_month, end_month)
    max_speed_lb = get_leaderboard_max(db, member_ids, Activity.max_speed, start_month, end_month)
    elev_high_lb = get_leaderboard_max(db, member_ids, Activity.elev_high, start_month, end_month)

    result = {
        "total_distance_km": round(total_distance / 1000, 2),
        "total_elevation_m": round(total_elevation, 1),
        "leaderboards": {
            "distance": distance_lb,
            "elevation": elevation_lb,
            "max_speed": max_speed_lb,
            "elev_high": elev_high_lb,
        }
    }
    print("Team stats:", result)
    result["leaderboards"] = {
        k: [{"user_id": uid, "value": val} for uid, val in v]
        for k, v in result["leaderboards"].items()
    }
    return TeamStatsResponse(**result)


@router.get("/getUserInfo")
def get_my_teams(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    user = db.exec(select(User).where(User.id == current_user.id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    result = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "profile_img_url": user.profile_img_url,
        "activities_count": len(user.activities),
        "teams_count": len(user.teams)
    }
    return result