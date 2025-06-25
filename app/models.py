from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint
from typing import Optional, List


class Activity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    strava_id: int = Field(index=True, nullable=False)
    name: str
    distance: float
    user_id: int = Field(foreign_key="user.id", nullable=False)
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
    strava_id: Optional[int] = Field(index=True, unique=True) 
    strava_access_token: Optional[str] = Field(nullable=True)
    profile_img_url: Optional[str] = Field(nullable=False, default="/default_user_img.jpg")
    activities: List[Activity] = Relationship(back_populates="user")
    teams: List["Team"] = Relationship(back_populates="members", link_model=UserTeamLink)


class TeamInvite(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="team.id")
    user_id: int = Field(foreign_key="user.id")
    accepted: bool = Field(default=False)
    team: Optional["Team"] = Relationship()
    user: Optional["User"] = Relationship()