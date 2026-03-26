from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from app.database import get_session
from app.models import User, Activity
from app.db_utils import save_activities
from sqlmodel import Session, select
from app.auth_helpers import get_current_user
from app.garmin_auth import get_garmin_client
from datetime import date, timedelta
from typing import Optional
import gpxpy
import polyline as polyline_encoder
import garminconnect

router = APIRouter()

GARMIN_ACTIVITY_TYPES = {"running", "hiking", "trail_running", "mountain_biking"}


def _fetch_polyline(garmin: garminconnect.Garmin, garmin_id: int) -> Optional[str]:
    try:
        gpx_bytes = garmin.download_activity(
            garmin_id,
            dl_fmt=garminconnect.Garmin.ActivityDownloadFormat.GPX
        )
        gpx = gpxpy.parse(gpx_bytes)
        points = []
        for track in gpx.tracks:
            for segment in track.segments:
                for point in segment.points:
                    points.append((point.latitude, point.longitude))
        if len(points) < 2:
            return None
        return polyline_encoder.encode(points)
    except Exception:
        return None


@router.get("/syncActivities")
def sync_activities(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if not current_user.garmin_connected:
        raise HTTPException(status_code=401, detail="Account Garmin non collegato")

    garmin = get_garmin_client(current_user)

    end_date = date.today()
    start_date = end_date - timedelta(days=30)

    try:
        activities = garmin.get_activities_by_date(
            start_date.isoformat(),
            end_date.isoformat()
        )
        filtered = [
            a for a in activities
            if a.get("activityType", {}).get("typeKey", "").lower() in GARMIN_ACTIVITY_TYPES
        ]

        for act in filtered:
            garmin_id = act.get("activityId")
            if garmin_id:
                act["_polyline"] = _fetch_polyline(garmin, garmin_id)

        save_activities(filtered, user_id=current_user.id, db=db)
        return {"message": f"Sincronizzate {len(filtered)} attività da Garmin."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore durante la sincronizzazione con Garmin: {str(e)}")


@router.get("/{activity_id}/export_gpx")
def export_gpx(
    activity_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    activity = db.exec(
        select(Activity).where(
            Activity.id == activity_id,
            Activity.user_id == current_user.id
        )
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Attività non trovata")

    garmin = get_garmin_client(current_user)

    try:
        gpx_data = garmin.download_activity(
            activity.garmin_id,
            dl_fmt=garminconnect.Garmin.ActivityDownloadFormat.GPX
        )
        return StreamingResponse(
            content=iter([gpx_data]),
            media_type="application/gpx+xml",
            headers={"Content-Disposition": f"attachment; filename=activity_{activity_id}.gpx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore durante il download GPX: {str(e)}")
