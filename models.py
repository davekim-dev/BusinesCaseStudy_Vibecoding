from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

# DB 주소만 바꾸면 PostgreSQL 등 다른 DB로 전환할 수 있다.
DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    original_text = Column(Text, nullable=False)
    status = Column(String(10), nullable=False, default="pending")  # pending / done / failed
    error_code = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.now)

    summary = relationship("Summary", back_populates="message", uselist=False)


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False)
    result = Column(JSON, nullable=False)  # who, when, where, what, how, why
    model_name = Column(String(50), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.now)

    message = relationship("Message", back_populates="summary")


def create_tables():
    Base.metadata.create_all(bind=engine)
