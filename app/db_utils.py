from sqlmodel import Session, select
from app.models import Activity


def get_user_activities(user_id: int, db: Session):
    return db.exec(
        select(Activity).where(Activity.user_id == user_id)
    ).all()


def get_activity_by_strava_id(user_id: int, strava_id: int, db: Session):
    return db.exec(
        select(Activity).where(
            Activity.user_id == user_id,
            Activity.strava_id == strava_id
        )
    ).first()

def save_activities(filtered: list, user_id: int, db: Session):
    for act in filtered:
        strava_id = act["id"]
        existing = db.exec(
            select(Activity).where(
                Activity.strava_id == strava_id,
                Activity.user_id == user_id
            )
        ).first()

        if not existing:
            new_activity = Activity(
                strava_id = strava_id,
                name = act["name"],
                distance = act["distance"],
                user_id = user_id,
                elevation = act["total_elevation_gain"],
                type = act["type"],
                date = act["start_date_local"],
                start_act = act["start_latlng"],
                end_act = act["end_latlng"],
                summary_polyline = act["map"]["summary_polyline"],
                avg_speed = act["average_speed"],
                max_speed = act["max_speed"],
                elev_high = act["elev_high"]
            )
            db.add(new_activity)
    db.commit()