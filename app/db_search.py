from datetime import date, datetime, time
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Form
from fastapi.responses import JSONResponse
from app.database import get_session
from typing import List, Optional
from app.models import User, Team, UserTeamLink, Activity, TeamEvent
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
                    "date": a.date,
                    "elevation": a.elevation,
                    "avg_speed": a.avg_speed,
                    "activity_type": a.activity_type
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
    # Verifica user nel team
    link = db.exec(
        select(UserTeamLink).where(
            UserTeamLink.team_id == team_id,
            UserTeamLink.user_id == current_user.id
        )
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Non sei membro di questo team")
    # Get degli id del team
    member_ids = db.exec(
        select(UserTeamLink.user_id).where(UserTeamLink.team_id == team_id)
    ).all()
    # Determina il mese
    start_month, end_month = get_month_range()
    # Preleva le statistiche del mese
    total_distance = get_team_total_distance(db, member_ids, start_month, end_month)
    total_elevation = get_team_total_elevation(db, member_ids, start_month, end_month)
    # Classifica (top 3) dei membri
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


@router.post("/teams/{team_id}/create_event", response_model=TeamEvent)
async def create_event(
    team_id: int,
    date: date = Form(...),
    hour: time = Form(...),
    name: str = Form(...),
    description: str = Form(...),
    start_place: str = Form(...),
    end_place: Optional[str] = Form(None),
    event_type: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team non trovato")

    if current_user not in team.members:
        raise HTTPException(status_code=403, detail="Non appartieni a questo team")

    img_url = "/public/default_event_img.jpg"

    if image:
        file_location = f"public/event_images/{team_id}_{image.filename}"
        with open(file_location, "wb") as f:
            f.write(await image.read())
        img_url = "/" + file_location

    new_event = TeamEvent(
        team_id=team_id,
        creator_id=current_user.id,
        date=date,
        hour=hour,
        name=name,
        description=description,
        start_place=start_place,
        end_place=end_place,
        event_type=event_type,
        event_img_url=img_url
    )

    session.add(new_event)
    session.commit()
    session.refresh(new_event)

    return new_event


@router.get("/teams/{team_id}/events", response_model=List[TeamEvent])
def list_team_events(team_id: int, session: Session = Depends(get_session)):
    events = session.exec(
        select(TeamEvent).where(TeamEvent.team_id == team_id)
    ).all()

    now = datetime.now()

    future_events = [
        e for e in events
        if datetime.combine(e.date, e.hour) >= now
    ]

    return future_events