import os
from sqlmodel import SQLModel, create_engine, Session

if os.getenv("RENDER") == "true":
    DATABASE_URL = os.getenv("DATABASE_URL")
    engine = create_engine(
        DATABASE_URL,
        echo=True
    )
else:
    DATABASE_URL = "sqlite:///local.db"
    engine = create_engine(
        DATABASE_URL,
        echo=True,
        connect_args={"check_same_thread": False}
    )


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session