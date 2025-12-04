from fastapi import APIRouter, HTTPException, Depends
import httpx
from app.database import get_session
from app.models import User
from app.db_utils import save_activities
import gpxpy
import gpxpy.gpx
from fastapi.responses import StreamingResponse
from sqlmodel import Session
from app.auth_helpers import get_current_user
from app.strava_auth import get_valid_strava_token

router = APIRouter()


@router.get("/syncActivities")
async def sync_activities(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    access_token = get_valid_strava_token(current_user, db)
    user_id = current_user.id
    print(f"access token : {access_token}, user id : {user_id}")
    if not access_token:
        raise HTTPException(status_code=401, detail="User not connected to Strava")

    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://www.strava.com/api/v3/athlete/activities",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            activities = res.json()
            filtered = [a for a in activities if a.get("type") in ["Run", "Hike"]]
            save_activities(filtered, user_id=user_id, db=db)
            return {"message": "Attività sincronizzate con Strava."}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Errore durante la sincronizzazione con Strava")



@router.get("/{activity_id}/export_gpx")
async def export_gpx(
        activity_id: int, 
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
    ):
    access_token = get_valid_strava_token(current_user, db)
    if not access_token:
        raise HTTPException(status_code=401, detail="User not authenticated")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://www.strava.com/api/v3/activities/{activity_id}/streams",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"keys": "latlng,time,altitude", "key_by_type": "true"}
        )

        data = response.json()

        if "latlng" not in data:
            raise HTTPException(status_code=404, detail="No GPS data found for this activity")

        latlng_stream = data["latlng"]["data"]
        time_stream = data.get("time", {}).get("data", [])
        alt_stream = data.get("altitude", {}).get("data", [])

        gpx = gpxpy.gpx.GPX()
        gpx_track = gpxpy.gpx.GPXTrack()
        gpx.tracks.append(gpx_track)
        gpx_segment = gpxpy.gpx.GPXTrackSegment()
        gpx_track.segments.append(gpx_segment)

        for i, point in enumerate(latlng_stream):
            lat, lon = point
            elevation = alt_stream[i] if i < len(alt_stream) else None
            timestamp = time_stream[i] if i < len(time_stream) else None
            gpx_segment.points.append(gpxpy.gpx.GPXTrackPoint(
                latitude=lat,
                longitude=lon,
                elevation=elevation,
            ))

        gpx_bytes = gpx.to_xml().encode("utf-8")

        return StreamingResponse(
            content=iter([gpx_bytes]),
            media_type="application/gpx+xml",
            headers={"Content-Disposition": f"attachment; filename=activity_{activity_id}.gpx"}
        )