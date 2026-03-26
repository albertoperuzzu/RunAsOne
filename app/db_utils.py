from sqlmodel import Session, select, func
from app.models import Activity
from datetime import datetime
from typing import List
from sqlalchemy import desc


def get_user_activities(user_id: int, db: Session):
    return db.exec(
        select(Activity)
        .where(Activity.user_id == user_id)
        .order_by(desc(Activity.date))
    ).all()


def get_activity_by_garmin_id(user_id: int, garmin_id: int, db: Session):
    return db.exec(
        select(Activity).where(
            Activity.user_id == user_id,
            Activity.garmin_id == garmin_id
        )
    ).first()


def get_month_range():
    now = datetime.now()
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if now.month == 12:
        end = start.replace(year=now.year + 1, month=1)
    else:
        end = start.replace(month=now.month + 1)
    return start, end


def save_activities(filtered: list, user_id: int, db: Session):
    for act in filtered:
        garmin_id = act.get("activityId")
        if not garmin_id:
            continue
        try:
            existing = db.exec(
                select(Activity).where(
                    Activity.garmin_id == garmin_id,
                    Activity.user_id == user_id
                )
            ).first()
        except Exception as e:
            print(f"Error in Query for activity {garmin_id} : {e}")
            continue
        poly = act.get("_polyline")
        if not existing:
            try:
                start_lat = act.get("startLatitude")
                start_lng = act.get("startLongitude")
                end_lat = act.get("endLatitude")
                end_lng = act.get("endLongitude")

                date_str = act.get("startTimeLocal", "")
                try:
                    activity_date = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    activity_date = datetime.strptime(date_str[:19], "%Y-%m-%dT%H:%M:%S")

                new_activity = Activity(
                    garmin_id=garmin_id,
                    name=act.get("activityName", "Attività"),
                    distance=act.get("distance", 0),
                    user_id=user_id,
                    elevation=act.get("elevationGain", 0),
                    activity_type=act.get("activityType", {}).get("typeKey", "running"),
                    date=activity_date,
                    start_act=[start_lat, start_lng] if start_lat is not None and start_lng is not None else None,
                    end_act=[end_lat, end_lng] if end_lat is not None and end_lng is not None else None,
                    summary_polyline=poly,
                    avg_speed=act.get("averageSpeed"),
                    max_speed=act.get("maxSpeed"),
                    elev_high=act.get("maxElevation"),
                )
                db.add(new_activity)
            except Exception as e:
                print(f"Errore durante la creazione dell'attività: {e}")
        elif poly and not existing.summary_polyline:
            existing.summary_polyline = poly
            db.add(existing)
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