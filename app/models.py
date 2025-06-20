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


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, nullable=False, unique=True)
    hashed_password: str
    strava_id: Optional[int] = Field(index=True, unique=True) 
    strava_access_token: Optional[str] = Field(nullable=True)

    activities: List[Activity] = Relationship(back_populates="user")