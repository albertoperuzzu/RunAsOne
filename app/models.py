import os
from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint
from sqlalchemy import Column, JSON, BigInteger
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, List
from datetime import datetime

if os.environ.get("DATABASE_URL", "").startswith("postgres"):
    JsonType = JSONB
else:
    JsonType = JSON

class Activity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    strava_id: int = Field(sa_column=Column(BigInteger, nullable=False, index=True))
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
    __table_args__ = (UniqueConstraint("strava_id", "user_id"),)
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


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True, nullable=False, unique=True)
    hashed_password: str
    strava_id: Optional[int] = Field(index=True) 
    strava_access_token: Optional[str] = Field(default=None, repr=False)
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