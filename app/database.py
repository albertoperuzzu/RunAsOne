import os
from sqlmodel import create_engine, SQLModel, Session

os.makedirs("data", exist_ok=True)

engine = create_engine("sqlite:///./data/database.db")

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as s:
        yield s