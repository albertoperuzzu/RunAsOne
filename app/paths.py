from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select, col
from app.models import UserPath, UserTeamLink, User
from app.auth_helpers import get_current_user
from app.database import get_session
from app.cloudinary_utils import is_production, upload_media
from typing import List, Optional
import gpxpy
import polyline as polyline_encoder
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "./uploads/paths"


def _parse_gpx(gpx_bytes: bytes) -> tuple[Optional[str], Optional[float], Optional[float]]:
    """Returns (encoded_polyline, distance_metres, elevation_gain_metres)."""
    try:
        gpx = gpxpy.parse(gpx_bytes.decode("utf-8", errors="replace"))
        points = []
        for track in gpx.tracks:
            for segment in track.segments:
                for point in segment.points:
                    points.append((point.latitude, point.longitude))

        encoded = polyline_encoder.encode(points) if len(points) >= 2 else None
        distance = gpx.length_2d()
        uphill, _ = gpx.get_uphill_downhill()
        return encoded, distance, uphill
    except Exception:
        return None, None, None


def _resolve_profile_img(url: Optional[str]) -> str:
    img = url or "/public/default_user_img.jpg"
    if not img.startswith("/uploads/") and not img.startswith("/") and not img.startswith("http"):
        img = f"/uploads/{img}"
    return img


@router.post("/upload", response_model=UserPath)
async def upload_path(
    name: str = Form(...),
    gpx_file: UploadFile = File(...),
    photo: Optional[UploadFile] = File(None),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    gpx_bytes = await gpx_file.read()
    summary_polyline, distance, elevation_gain = _parse_gpx(gpx_bytes)

    # Salva il file GPX originale
    if is_production():
        gpx_url = upload_media(gpx_bytes, folder="gpx", resource_type="raw")
    else:
        gpx_dir = "./uploads/gpx"
        os.makedirs(gpx_dir, exist_ok=True)
        gpx_filename = f"{uuid.uuid4()}.gpx"
        with open(os.path.join(gpx_dir, gpx_filename), "wb") as f:
            f.write(gpx_bytes)
        gpx_url = f"gpx/{gpx_filename}"

    photo_url = None
    if photo and photo.filename:
        content = await photo.read()
        if is_production():
            photo_url = upload_media(content, folder="paths")
        else:
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            ext = photo.filename.rsplit(".", 1)[-1]
            filename = f"{uuid.uuid4()}.{ext}"
            with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
                f.write(content)
            photo_url = f"paths/{filename}"

    path = UserPath(
        user_id=current_user.id,
        name=name,
        photo_url=photo_url,
        summary_polyline=summary_polyline,
        distance=distance,
        elevation_gain=elevation_gain,
        gpx_url=gpx_url,
    )
    db.add(path)
    db.commit()
    db.refresh(path)
    return path


@router.get("/", response_model=List[UserPath])
def get_paths(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    return db.exec(
        select(UserPath).where(UserPath.user_id == current_user.id)
    ).all()


@router.get("/team/{team_id}")
def get_team_paths(
    team_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    link = db.exec(
        select(UserTeamLink).where(
            UserTeamLink.team_id == team_id,
            UserTeamLink.user_id == current_user.id,
        )
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Non sei membro di questo team")

    member_links = db.exec(
        select(UserTeamLink).where(UserTeamLink.team_id == team_id)
    ).all()
    member_ids = [l.user_id for l in member_links]

    paths = db.exec(
        select(UserPath)
        .where(col(UserPath.user_id).in_(member_ids))
        .order_by(col(UserPath.created_at).desc())
    ).all()

    result = []
    for path in paths:
        user = db.get(User, path.user_id)
        result.append({
            "id": path.id,
            "name": path.name,
            "photo_url": path.photo_url,
            "summary_polyline": path.summary_polyline,
            "distance": path.distance,
            "elevation_gain": path.elevation_gain,
            "gpx_url": path.gpx_url,
            "created_at": path.created_at.isoformat(),
            "user": {
                "id": user.id,
                "name": user.name,
                "profile_img_url": _resolve_profile_img(user.profile_img_url),
            },
        })
    return result


@router.delete("/{path_id}", status_code=204)
def delete_path(
    path_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_session),
):
    path = db.get(UserPath, path_id)
    if not path or path.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Percorso non trovato")
    db.delete(path)
    db.commit()
