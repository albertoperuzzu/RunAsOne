from fastapi import APIRouter, Depends, HTTPException, Form
from app.database import get_session
from app.models import User, Team, UserTeamLink, TeamInvite
from sqlmodel import Session, select
from app.auth_helpers import get_current_user

router = APIRouter()

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