from sqlmodel import Session, select, text, func
from app.models import Activity
from datetime import datetime
from typing import List, Tuple
from sqlalchemy import desc


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


def get_month_range():
    now = datetime.now()
    start = now.replace(month=now.month-1, day=1, hour=0, minute=0, second=0, microsecond=0)
    if now.month == 12:
        end = start.replace(year=now.year + 1, month=1)
    else:
        end = start.replace(month=now.month + 1)
    return start, end


def save_activities(filtered: list, user_id: int, db: Session):
    for act in filtered:
        strava_id = act["id"]
        try:
            existing = db.exec(
                select(Activity).where(
                    Activity.strava_id == strava_id,
                    Activity.user_id == user_id
                )
            ).first()
        except Exception as e:
            print(f"Error in Query for activity {strava_id} : {e}")
        print(f"ACT ID : {existing}")
        if not existing:
            try:
                print(f"DATA 1"),
                new_activity = Activity(
                    strava_id = strava_id,
                    name = act["name"],
                    distance = act["distance"],
                    user_id = user_id,
                    elevation = act["total_elevation_gain"],
                    activity_type = act["type"],
                    date = datetime.strptime(act["start_date_local"], '%Y-%m-%dT%H:%M:%SZ'),
                    start_act = act["start_latlng"],
                    end_act = act["end_latlng"],
                    summary_polyline = act["map"]["summary_polyline"],
                    avg_speed = act["average_speed"],
                    max_speed = act["max_speed"],
                    elev_high = act["elev_high"]
                )
                db.add(new_activity)
            except Exception as e:
                print(f"Errore durante la creazione dell'attività: {e}")
    try: 
        db.commit()
    except Exception as e:
        print(f"Error in Commit to DB : {e}")


def get_team_total_distance(db: Session, member_ids: List[int], start: datetime, end: datetime) -> float:
    total = db.exec(
        select(func.sum(Activity.distance)).where(
            Activity.user_id.in_(member_ids),
            Activity.date >= start,
            Activity.date < end
        )
    ).one()
    return total or 0.0


def get_team_total_elevation(db: Session, member_ids: List[int], start: datetime, end: datetime) -> float:
    total = db.exec(
        select(func.sum(Activity.elevation)).where(
            Activity.user_id.in_(member_ids),
            Activity.date >= start,
            Activity.date < end
        )
    ).one()
    return total or 0.0


def get_leaderboard_sum(
    db: Session,
    member_ids: List[int],
    column,
    start: datetime,
    end: datetime,
    limit: int = 3
):
    results = db.exec(
        select(Activity.user_id, func.sum(column).label("total"))
        .where(
            Activity.user_id.in_(member_ids),
            Activity.date >= start,
            Activity.date < end
        )
        .group_by(Activity.user_id)
        .order_by(desc("total"))
        .limit(limit)
    ).all()
    return format_lb_sum(column, results)


def get_leaderboard_max(
    db: Session,
    member_ids: List[int],
    column,
    start: datetime,
    end: datetime,
    limit: int = 3
):
    results = db.exec(
        select(Activity.user_id, func.max(column).label("max"))
        .where(
            Activity.user_id.in_(member_ids),
            Activity.date >= start,
            Activity.date < end
        )
        .group_by(Activity.user_id)
        .order_by(desc("max"))
        .limit(limit)
    ).all()
    return format_lb_sum(column, results)


def format_lb_sum(column, results):
    if column == Activity.distance:
        return [(r[0], r[1] / 1000) for r in results]
    elif column == Activity.max_speed:
        return [(r[0], r[1] * 3.6) for r in results]
    return [(r[0], r[1]) for r in results]