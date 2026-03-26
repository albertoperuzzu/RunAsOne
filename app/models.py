import os
from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint
from sqlalchemy import Column, JSON, BigInteger
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, List
from datetime import datetime
from datetime import time as TimeType
from datetime import date as DateType

if os.environ.get("DATABASE_URL", "").startswith("postgres"):
    JsonType = JSONB
else:
    JsonType = JSON


class Activity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    garmin_id: int = Field(sa_column=Column(BigInteger, nullable=False, index=True))
    name: str
    distance: Optional[float] = Field(default=None)
    elevation : Optional[float] = Field(default=None)
    user_id: int = Field(foreign_key="user.id", nullable=False)
    activity_type: str = Field(default=None, alias="type")
    date: datetime
    start_act: Optional[List[float]] = Field(sa_column=Column(JsonType), default=None)
    end_act: Optional[List[float]] = Field(sa_column=Column(JsonType), default=None)
    summary_polyline: Optional[str] = Field(default=None)
    avg_speed : Optional[float] = Field(default=None)
    max_speed : Optional[float] = Field(default=None)
    elev_high : Optional[float] = Field(default=None)
    __table_args__ = (UniqueConstraint("garmin_id", "user_id"),)
    user: Optional["User"] = Relationship(back_populates="activities")


class UserTeamLink(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    team_id: int = Field(foreign_key="team.id", primary_key=True)
    role: str = Field(default="member")


class Team(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(nullable=False, unique=True)
    image_url: Optional[str] = Field(default=None)
    members: List["User"] = Relationship(back_populates="teams", link_model=UserTeamLink)
    events: List["TeamEvent"] = Relationship(back_populates="team")


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True, nullable=False, unique=True)
    hashed_password: str
    garmin_connected: bool = Field(default=False)
    garmin_session_data: Optional[str] = Field(default=None, repr=False)
    profile_img_url: Optional[str] = Field(nullable=False, default="/public/default_user_img.jpg")
    activities: List[Activity] = Relationship(back_populates="user")
    teams: List["Team"] = Relationship(back_populates="members", link_model=UserTeamLink)


class UserCreate(SQLModel):
    email: str
    name: str
    password: str


class TeamInvite(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="team.id")
    user_id: int = Field(foreign_key="user.id")
    accepted: bool = Field(default=False)
    team: Optional["Team"] = Relationship()
    user: Optional["User"] = Relationship()


class TeamEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="team.id")
    creator_id: int = Field(foreign_key="user.id")
    date: DateType = Field(nullable=False)
    hour: TimeType = Field(nullable=False)
    name: str = Field(nullable=False)
    description: str = Field(nullable=False)
    start_place: str = Field(nullable=False)
    end_place: Optional[str] = None
    event_type: Optional[str] = None
    event_img_url: Optional[str] = Field(default="/public/default_event_img.jpg")
    team: Optional["Team"] = Relationship(back_populates="events")