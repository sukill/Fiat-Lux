import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# MySQL connection string from environment variables or default
DB_URL = os.getenv(
    "DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/fiat_lux"
)

# For local development/testing, you might want to use SQLite as a fallback or if DB_URL is not set
# but the user specifically asked for MySQL.
engine = create_engine(
    DB_URL,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Only import models here to avoid circular imports during table creation

    Base.metadata.create_all(bind=engine)
