from datetime import date, datetime, time, timedelta
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Form
from fastapi.responses import JSONResponse
from app.database import get_session
from typing import List, Optional
from app.models import User, Team, UserTeamLink, Activity, TeamEvent, TeamPost, EventPhoto, PostPhoto, Notification
from app.custom_beans import TeamStatsResponse
from app.cloudinary_utils import is_production, upload_media
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
        link = db.exec(
            select(UserTeamLink).where(
                UserTeamLink.team_id == team.id,
                UserTeamLink.user_id == current_user.id
            )
        ).first()
        result.append({
            "id": team.id,
            "name": team.name,
            "image_url": team.image_url,
            "is_admin": link.role == "admin" if link else False,
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
            if not profile_img.startswith("/uploads/") and not profile_img.startswith("/") and not profile_img.startswith("http"):
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
                    "activity_type": a.activity_type,
                    "user": {
                        "username": user.name,
                        "profile_img_url": profile_img,
                    },
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
    content = image.file.read()

    if is_production():
        image_url = upload_media(content, folder="teams")
    else:
        extension = image.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{extension}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(content)
        image_url = filename

    new_team = Team(name=name, image_url=image_url)
    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    link = UserTeamLink(user_id=current_user.id, team_id=new_team.id, role="admin")
    db.add(link)
    db.commit()
    return JSONResponse(status_code=201, content={"message": "Team creato", "team_id": new_team.id})


@router.put("/teams/{team_id}")
async def update_team(
    team_id: int,
    name: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    link = session.exec(
        select(UserTeamLink).where(
            UserTeamLink.team_id == team_id,
            UserTeamLink.user_id == current_user.id
        )
    ).first()
    if not link or link.role != "admin":
        raise HTTPException(status_code=403, detail="Solo l'admin può modificare il team")

    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team non trovato")

    if name:
        team.name = name

    if image and image.filename:
        content = await image.read()
        if is_production():
            team.image_url = upload_media(content, folder="teams")
        else:
            extension = image.filename.split(".")[-1]
            filename = f"{uuid.uuid4()}.{extension}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            with open(filepath, "wb") as f:
                f.write(content)
            team.image_url = filename

    session.add(team)
    session.commit()
    session.refresh(team)
    return {"id": team.id, "name": team.name, "image_url": team.image_url}


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
    distance_km: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
    path_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team non trovato")

    if current_user not in team.members:
        raise HTTPException(status_code=403, detail="Non appartieni a questo team")

    img_url = None

    if image and image.filename:
        content = await image.read()
        if is_production():
            img_url = upload_media(content, folder="events")
        else:
            os.makedirs(os.path.join(UPLOAD_DIR, "events"), exist_ok=True)
            extension = image.filename.split(".")[-1]
            filename = f"events/{uuid.uuid4()}.{extension}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            with open(filepath, "wb") as f:
                f.write(content)
            img_url = filename

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
        distance_km=distance_km,
        event_img_url=img_url,
        path_id=path_id,
    )

    session.add(new_event)
    session.commit()
    session.refresh(new_event)

    # Auto-crea un post in bacheca per l'evento
    auto_post = TeamPost(
        team_id=team_id,
        user_id=current_user.id,
        title=f"🗓️ {name}",
        description=description,
        photo_url=team.image_url,
        event_id=new_event.id,
    )
    session.add(auto_post)
    session.commit()
    session.refresh(auto_post)

    _notify_team(
        session, team_id, auto_post.id, current_user.id,
        f"{current_user.name} ha creato l'evento \"{name}\" in {team.name}",
    )
    session.commit()
    session.refresh(new_event)

    return new_event


def _event_to_dict(event: TeamEvent, session: Session) -> dict:
    photos = session.exec(select(EventPhoto).where(EventPhoto.event_id == event.id)).all()
    return {
        "id": event.id,
        "creator_id": event.creator_id,
        "name": event.name,
        "date": str(event.date),
        "hour": str(event.hour),
        "description": event.description,
        "start_place": event.start_place,
        "end_place": event.end_place,
        "event_type": event.event_type,
        "distance_km": event.distance_km,
        "event_img_url": event.event_img_url,
        "path_id": event.path_id,
        "photos": [{"id": p.id, "photo_url": p.photo_url, "user_id": p.user_id} for p in photos],
    }


@router.get("/teams/{team_id}/events")
def list_team_events(team_id: int, session: Session = Depends(get_session)):
    events = session.exec(
        select(TeamEvent).where(TeamEvent.team_id == team_id)
    ).all()
    cutoff = datetime.now() - timedelta(hours=24)
    return [_event_to_dict(e, session) for e in events if datetime.combine(e.date, e.hour) >= cutoff]


@router.get("/teams/{team_id}/past_events")
def list_past_events(team_id: int, session: Session = Depends(get_session)):
    events = session.exec(
        select(TeamEvent).where(TeamEvent.team_id == team_id)
    ).all()
    cutoff = datetime.now() - timedelta(hours=24)
    return [_event_to_dict(e, session) for e in events if datetime.combine(e.date, e.hour) < cutoff]


@router.put("/teams/{team_id}/events/{event_id}", response_model=TeamEvent)
async def update_event(
    team_id: int,
    event_id: int,
    date: date = Form(...),
    hour: time = Form(...),
    name: str = Form(...),
    description: str = Form(...),
    start_place: str = Form(...),
    end_place: Optional[str] = Form(None),
    event_type: Optional[str] = Form(None),
    distance_km: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
    path_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    event = session.get(TeamEvent, event_id)
    if not event or event.team_id != team_id:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    if event.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo il creatore può modificare l'evento")

    event.name = name
    event.description = description
    event.date = date
    event.hour = hour
    event.start_place = start_place
    event.end_place = end_place
    event.event_type = event_type
    event.distance_km = distance_km
    event.path_id = path_id

    if image and image.filename:
        content = await image.read()
        if is_production():
            event.event_img_url = upload_media(content, folder="events")
        else:
            os.makedirs(os.path.join(UPLOAD_DIR, "events"), exist_ok=True)
            extension = image.filename.split(".")[-1]
            filename = f"events/{uuid.uuid4()}.{extension}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            with open(filepath, "wb") as f:
                f.write(content)
            event.event_img_url = filename

    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@router.delete("/teams/{team_id}/events/{event_id}", status_code=204)
def delete_event(
    team_id: int,
    event_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    event = session.get(TeamEvent, event_id)
    if not event or event.team_id != team_id:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    if event.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo il creatore può cancellare l'evento")
    session.delete(event)
    session.commit()


# ── Bacheca (TeamPost) ──────────────────────────────────────────────────────

def _notify_team(session: Session, team_id: int, post_id: int, author_id: int, message: str):
    """Crea una Notification per ogni membro del team tranne l'autore."""
    links = session.exec(
        select(UserTeamLink).where(UserTeamLink.team_id == team_id)
    ).all()
    for link in links:
        if link.user_id != author_id:
            session.add(Notification(
                user_id=link.user_id,
                team_id=team_id,
                post_id=post_id,
                message=message,
            ))


def _post_to_dict(post: TeamPost, db: Session) -> dict:
    user = db.get(User, post.user_id)
    profile_img = user.profile_img_url or "/public/default_user_img.jpg"
    if not profile_img.startswith("/uploads/") and not profile_img.startswith("/") and not profile_img.startswith("http"):
        profile_img = f"/uploads/{profile_img}"
    event_info = None
    if post.event_id:
        ev = db.get(TeamEvent, post.event_id)
        if ev:
            event_info = {"id": ev.id, "name": ev.name}
    post_photos = db.exec(select(PostPhoto).where(PostPhoto.post_id == post.id)).all()
    return {
        "id": post.id,
        "title": post.title,
        "description": post.description,
        "photo_url": post.photo_url,
        "event_id": post.event_id,
        "created_at": post.created_at.isoformat(),
        "user": {"id": user.id, "name": user.name, "profile_img_url": profile_img},
        "event": event_info,
        "photos": [{"id": p.id, "photo_url": p.photo_url, "user_id": p.user_id} for p in post_photos],
    }


@router.get("/teams/{team_id}/posts")
def get_posts(
    team_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    link = session.exec(
        select(UserTeamLink).where(UserTeamLink.team_id == team_id, UserTeamLink.user_id == current_user.id)
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Non sei membro di questo team")
    posts = session.exec(
        select(TeamPost).where(TeamPost.team_id == team_id).order_by(TeamPost.created_at.desc())
    ).all()
    return [_post_to_dict(p, session) for p in posts]


@router.post("/teams/{team_id}/posts")
async def create_post(
    team_id: int,
    title: str = Form(...),
    description: str = Form(...),
    event_id: Optional[int] = Form(None),
    photo: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    link = session.exec(
        select(UserTeamLink).where(UserTeamLink.team_id == team_id, UserTeamLink.user_id == current_user.id)
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Non sei membro di questo team")

    photo_url = None
    if photo and photo.filename:
        content = await photo.read()
        if is_production():
            photo_url = upload_media(content, folder="posts")
        else:
            os.makedirs(os.path.join(UPLOAD_DIR, "posts"), exist_ok=True)
            ext = photo.filename.rsplit(".", 1)[-1]
            filename = f"posts/{uuid.uuid4()}.{ext}"
            with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
                f.write(content)
            photo_url = filename

    post = TeamPost(team_id=team_id, user_id=current_user.id, title=title, description=description,
                    photo_url=photo_url, event_id=event_id)
    session.add(post)
    session.commit()
    session.refresh(post)

    team = session.get(Team, team_id)
    _notify_team(
        session, team_id, post.id, current_user.id,
        f"{current_user.name} ha pubblicato \"{post.title}\" in {team.name if team else 'team'}",
    )
    session.commit()

    return _post_to_dict(post, session)


@router.put("/teams/{team_id}/posts/{post_id}")
async def update_post(
    team_id: int,
    post_id: int,
    title: str = Form(...),
    description: str = Form(...),
    event_id: Optional[int] = Form(None),
    photo: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    link = session.exec(
        select(UserTeamLink).where(UserTeamLink.team_id == team_id, UserTeamLink.user_id == current_user.id)
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Non sei membro di questo team")

    post = session.get(TeamPost, post_id)
    if not post or post.team_id != team_id:
        raise HTTPException(status_code=404, detail="Post non trovato")
    if post.user_id != current_user.id and link.role != "admin":
        raise HTTPException(status_code=403, detail="Non puoi modificare questo post")

    if photo and photo.filename:
        content = await photo.read()
        if is_production():
            post.photo_url = upload_media(content, folder="posts")
        else:
            os.makedirs(os.path.join(UPLOAD_DIR, "posts"), exist_ok=True)
            ext = photo.filename.rsplit(".", 1)[-1]
            filename = f"posts/{uuid.uuid4()}.{ext}"
            with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
                f.write(content)
            post.photo_url = filename

    post.title = title
    post.description = description
    post.event_id = event_id
    session.add(post)
    session.commit()
    session.refresh(post)
    return _post_to_dict(post, session)


@router.delete("/teams/{team_id}/posts/{post_id}", status_code=204)
def delete_post(
    team_id: int,
    post_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    link = session.exec(
        select(UserTeamLink).where(UserTeamLink.team_id == team_id, UserTeamLink.user_id == current_user.id)
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Non sei membro di questo team")

    post = session.get(TeamPost, post_id)
    if not post or post.team_id != team_id:
        raise HTTPException(status_code=404, detail="Post non trovato")
    if post.user_id != current_user.id and link.role != "admin":
        raise HTTPException(status_code=403, detail="Non puoi eliminare questo post")

    session.delete(post)
    session.commit()


# ── Foto eventi ──────────────────────────────────────────────────────────────

def _check_event_permission(team_id: int, event_id: int, current_user: User, session: Session):
    link = session.exec(
        select(UserTeamLink).where(UserTeamLink.team_id == team_id, UserTeamLink.user_id == current_user.id)
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Non sei membro di questo team")
    event = session.get(TeamEvent, event_id)
    if not event or event.team_id != team_id:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    if event.creator_id != current_user.id and link.role != "admin":
        raise HTTPException(status_code=403, detail="Solo il creatore o l'admin possono gestire le foto")
    return event


@router.post("/teams/{team_id}/events/{event_id}/photos")
async def add_event_photo(
    team_id: int,
    event_id: int,
    photo: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    _check_event_permission(team_id, event_id, current_user, session)
    content = await photo.read()
    if is_production():
        photo_url = upload_media(content, folder="event_photos")
    else:
        os.makedirs(os.path.join(UPLOAD_DIR, "event_photos"), exist_ok=True)
        ext = photo.filename.rsplit(".", 1)[-1]
        filename = f"event_photos/{uuid.uuid4()}.{ext}"
        with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
            f.write(content)
        photo_url = filename
    new_photo = EventPhoto(event_id=event_id, user_id=current_user.id, photo_url=photo_url)
    session.add(new_photo)
    session.commit()
    session.refresh(new_photo)
    return {"id": new_photo.id, "photo_url": new_photo.photo_url, "user_id": new_photo.user_id}


@router.delete("/teams/{team_id}/events/{event_id}/photos/{photo_id}", status_code=204)
def delete_event_photo(
    team_id: int, event_id: int, photo_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    _check_event_permission(team_id, event_id, current_user, session)
    photo = session.get(EventPhoto, photo_id)
    if not photo or photo.event_id != event_id:
        raise HTTPException(status_code=404, detail="Foto non trovata")
    session.delete(photo)
    session.commit()


# ── Foto post ─────────────────────────────────────────────────────────────────

def _check_post_permission(team_id: int, post_id: int, current_user: User, session: Session):
    link = session.exec(
        select(UserTeamLink).where(UserTeamLink.team_id == team_id, UserTeamLink.user_id == current_user.id)
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Non sei membro di questo team")
    post = session.get(TeamPost, post_id)
    if not post or post.team_id != team_id:
        raise HTTPException(status_code=404, detail="Post non trovato")
    if post.user_id != current_user.id and link.role != "admin":
        raise HTTPException(status_code=403, detail="Solo il creatore o l'admin possono gestire le foto")
    return post


@router.post("/teams/{team_id}/posts/{post_id}/photos")
async def add_post_photo(
    team_id: int,
    post_id: int,
    photo: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    _check_post_permission(team_id, post_id, current_user, session)
    content = await photo.read()
    if is_production():
        photo_url = upload_media(content, folder="post_photos")
    else:
        os.makedirs(os.path.join(UPLOAD_DIR, "post_photos"), exist_ok=True)
        ext = photo.filename.rsplit(".", 1)[-1]
        filename = f"post_photos/{uuid.uuid4()}.{ext}"
        with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
            f.write(content)
        photo_url = filename
    new_photo = PostPhoto(post_id=post_id, user_id=current_user.id, photo_url=photo_url)
    session.add(new_photo)
    session.commit()
    session.refresh(new_photo)
    return {"id": new_photo.id, "photo_url": new_photo.photo_url, "user_id": new_photo.user_id}


@router.delete("/teams/{team_id}/posts/{post_id}/photos/{photo_id}", status_code=204)
def delete_post_photo(
    team_id: int, post_id: int, photo_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    _check_post_permission(team_id, post_id, current_user, session)
    photo = session.get(PostPhoto, photo_id)
    if not photo or photo.post_id != post_id:
        raise HTTPException(status_code=404, detail="Foto non trovata")
    session.delete(photo)
    session.commit()