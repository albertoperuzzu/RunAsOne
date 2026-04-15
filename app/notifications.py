from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database import get_session
from app.models import Notification
from app.auth_helpers import get_current_user

router = APIRouter()


@router.get("/")
def get_notifications(
    current_user=Depends(get_current_user),
    session: Session = Depends(get_session),
):
    notifications = session.exec(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    ).all()
    return [
        {
            "id": n.id,
            "team_id": n.team_id,
            "post_id": n.post_id,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifications
    ]


@router.get("/unread-count")
def get_unread_count(
    current_user=Depends(get_current_user),
    session: Session = Depends(get_session),
):
    notifications = session.exec(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,  # noqa: E712
        )
    ).all()
    return {"count": len(notifications)}


@router.post("/read-all")
def mark_all_read(
    current_user=Depends(get_current_user),
    session: Session = Depends(get_session),
):
    unread = session.exec(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,  # noqa: E712
        )
    ).all()
    for n in unread:
        n.is_read = True
        session.add(n)
    session.commit()
    return {"marked_read": len(unread)}
