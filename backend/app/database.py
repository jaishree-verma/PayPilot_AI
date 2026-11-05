import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

# If using sqlite with a relative path, ensure it resolves to backend/paypilot.db
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///./") or db_url == "sqlite:///paypilot.db":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_file = os.path.join(base_dir, "paypilot.db")
    db_url = f"sqlite:///{db_file.replace(os.sep, '/')}"

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

