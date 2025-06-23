from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form
from fastapi.responses import JSONResponse
from app.database import get_session
from app.models import User, Team, UserTeamLink, TeamInvite
from app.db_utils import get_user_activities
from sqlmodel import Session, select
from app.auth_helpers import get_current_user
import uuid
import shutil
import os

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
def get_team(team_id: int, db: Session = Depends(get_session)):
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team non trovato")
    return team


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


@router.post("/teams/{team_id}/invite")
def invite_user_to_team(
    team_id: int,
    email: str = Form(...),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team non trovato")

    link = db.exec(
        select(UserTeamLink)
        .where(UserTeamLink.team_id == team_id, UserTeamLink.user_id == current_user.id)
    ).first()

    if not link or link.role != "admin":
        raise HTTPException(status_code=403, detail="Solo l'amministratore può invitare utenti")

    invited_user = db.exec(select(User).where(User.email == email)).first()
    if not invited_user:
        raise HTTPException(status_code=404, detail="Utente non trovato")

    existing_link = db.exec(
        select(UserTeamLink)
        .where(UserTeamLink.team_id == team_id, UserTeamLink.user_id == invited_user.id)
    ).first()
    if existing_link:
        raise HTTPException(status_code=400, detail="L'utente fa già parte del team")

    existing_invite = db.exec(
        select(TeamInvite)
        .where(TeamInvite.team_id == team_id, TeamInvite.user_id == invited_user.id, TeamInvite.accepted == False)
    ).first()
    if existing_invite:
        raise HTTPException(status_code=400, detail="L'utente è già stato invitato")

    invite = TeamInvite(team_id=team_id, user_id=invited_user.id)
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return {"message": "Invito inviato con successo", "invite_id": invite.id}


@router.get("/check_invites")
def get_user_invites(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    invites = db.exec(
        select(TeamInvite, Team)
        .where(TeamInvite.user_id == current_user.id)
        .where(TeamInvite.accepted == False)
        .join(Team, TeamInvite.team_id == Team.id)
    ).all()
    
    result = [
        {
            "id": invite.id,
            "team_id": invite.team_id,
            "team": {
                "name": team.name
            }
        }
        for invite, team in invites
    ]
    return result


@router.post("/invites/{invite_id}/accept")
def accept_invite(
    invite_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    invite = db.get(TeamInvite, invite_id)
    if not invite or invite.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Invito non valido")

    invite.accepted = True

    link = UserTeamLink(user_id=current_user.id, team_id=invite.team_id)
    db.add(link)
    db.commit()
    return {"message": "Invito accettato"}


@router.delete("/invites/{invite_id}/reject")
def reject_invite(
    invite_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    invite = db.get(TeamInvite, invite_id)
    if not invite or invite.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Invito non valido")

    db.delete(invite)
    db.commit()
    return {"message": "Invito rifiutato"}