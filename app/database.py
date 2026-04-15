import os
from sqlmodel import SQLModel, create_engine, Session

if os.getenv("RENDER") == "true":
    DATABASE_URL = os.getenv("DATABASE_URL")
    engine = create_engine(
        DATABASE_URL,
        echo=True,
        pool_size=5,
        max_overflow=2,
        pool_timeout=30,
        pool_recycle=1800,
        connect_args={"sslmode": "require"}
    )
else:
    DATABASE_URL = "sqlite:///database.db"
    engine = create_engine(
        DATABASE_URL,
        echo=True,
        connect_args={"check_same_thread": False}
    )


def create_db_and_tables():
    print("RENDER =", os.getenv("RENDER"))
    print("DATABASE_URL =", DATABASE_URL)
    SQLModel.metadata.create_all(engine)


def migrate_db():
    """Additive schema migrations — safe to run on every startup (errors are silenced)."""
    from sqlalchemy import text
    migrations = [
        "ALTER TABLE userpath ADD COLUMN distance REAL",
        "ALTER TABLE userpath ADD COLUMN elevation_gain REAL",
        "ALTER TABLE teamevent ADD COLUMN path_id INTEGER REFERENCES userpath(id)",
        "ALTER TABLE userpath ADD COLUMN gpx_url TEXT",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass  # column already exists


def get_session():
    with Session(engine) as session:
        yield session