"""
Database module for multi-user retirement planning simulator.

Handles all database operations including user management, scenario persistence,
authentication, and session state management.

Supported databases:
- PostgreSQL (production)
- SQLite (development/MVP)
"""

import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, Boolean, ForeignKey, Text, JSON, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from sqlalchemy.pool import NullPool

# Database configuration
Base = declarative_base()

# Determine database URL from environment or use SQLite for development
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./retirement_simulator.db"  # Development default
)

# For production, recommend PostgreSQL:
# DATABASE_URL = "postgresql://user:password@localhost/retirement_simulator"


class User(Base):
    """User account model."""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True)  # UUID
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    scenarios = relationship("Scenario", back_populates="owner", cascade="all, delete-orphan", foreign_keys="Scenario.owner_id")
    shares_received = relationship("ScenarioShare", back_populates="shared_with_user", foreign_keys="ScenarioShare.shared_with_user_id", cascade="all, delete-orphan")
    shares_created = relationship("ScenarioShare", back_populates="created_by", foreign_keys="ScenarioShare.created_by_id")
    versions = relationship("ScenarioVersion", back_populates="created_by_user", foreign_keys="ScenarioVersion.created_by_id")
    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.user_id")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan", foreign_keys="UserPreferences.user_id")

    def __repr__(self):
        return f"<User {self.email}>"


class Scenario(Base):
    """Retirement planning scenario model."""

    __tablename__ = "scenarios"

    id = Column(String(36), primary_key=True)  # UUID
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)

    # Household data (serialized as JSON)
    household_data = Column(JSON, nullable=False)

    # Simulation results (can be large, so stored separately)
    results_data = Column(JSON)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    is_archived = Column(Boolean, default=False)

    # Relationships
    owner = relationship("User", back_populates="scenarios")
    shares = relationship("ScenarioShare", back_populates="scenario", cascade="all, delete-orphan")
    versions = relationship("ScenarioVersion", back_populates="scenario", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="scenario", cascade="all, delete-orphan")

    # Indexes for common queries
    __table_args__ = (
        Index('idx_owner_created', 'owner_id', 'created_at'),
        Index('idx_owner_updated', 'owner_id', 'updated_at'),
    )

    def __repr__(self):
        return f"<Scenario {self.name}>"


class ScenarioShare(Base):
    """Sharing permissions for scenarios."""

    __tablename__ = "scenario_shares"

    id = Column(String(36), primary_key=True)  # UUID
    scenario_id = Column(String(36), ForeignKey("scenarios.id"), nullable=False, index=True)
    shared_with_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    permission_level = Column(String(20), default="viewer")  # viewer, editor, owner

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by_id = Column(String(36), ForeignKey("users.id"))  # Who created this share

    # Relationships
    scenario = relationship("Scenario", back_populates="shares")
    shared_with_user = relationship("User", back_populates="shares_received", foreign_keys=[shared_with_user_id])
    created_by = relationship("User", back_populates="shares_created", foreign_keys=[created_by_id])

    __table_args__ = (
        Index('idx_scenario_user', 'scenario_id', 'shared_with_user_id'),
    )

    def __repr__(self):
        return f"<ScenarioShare {self.scenario_id} -> {self.shared_with_user_id}>"


class ScenarioVersion(Base):
    """Version history for scenarios (for tracking changes)."""

    __tablename__ = "scenario_versions"

    id = Column(String(36), primary_key=True)  # UUID
    scenario_id = Column(String(36), ForeignKey("scenarios.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)  # Sequential version

    # Who made this version
    created_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # What changed
    change_description = Column(Text)
    household_data = Column(JSON, nullable=False)

    # Relationships
    scenario = relationship("Scenario", back_populates="versions")
    created_by_user = relationship("User", back_populates="versions")

    __table_args__ = (
        Index('idx_scenario_version', 'scenario_id', 'version_number'),
    )

    def __repr__(self):
        return f"<ScenarioVersion {self.scenario_id} v{self.version_number}>"


class AuditLog(Base):
    """Audit trail for compliance and security."""

    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True)  # UUID
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    scenario_id = Column(String(36), ForeignKey("scenarios.id"), nullable=False, index=True)

    # What happened
    action = Column(String(50), nullable=False)  # create, update, delete, share, restore, etc.
    details = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
    scenario = relationship("Scenario", back_populates="audit_logs")

    __table_args__ = (
        Index('idx_user_action', 'user_id', 'action'),
        Index('idx_scenario_action', 'scenario_id', 'action'),
    )

    def __repr__(self):
        return f"<AuditLog {self.action} on {self.scenario_id}>"


class UserPreferences(Base):
    """User settings and preferences."""

    __tablename__ = "user_preferences"

    id = Column(String(36), primary_key=True)  # UUID
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)

    # Default settings
    default_province = Column(String(2), default="ON")
    default_inflation = Column(Float, default=0.02)
    default_theme = Column(String(20), default="light")

    # UI preferences
    show_graphs = Column(Boolean, default=True)
    show_details = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="preferences")

    def __repr__(self):
        return f"<UserPreferences {self.user_id}>"


# Database engine setup
def get_engine():
    """Get database engine based on DATABASE_URL."""
    engine = create_engine(
        DATABASE_URL,
        echo=os.getenv("SQL_ECHO", "false").lower() == "true",
        poolclass=NullPool if "sqlite" in DATABASE_URL else None,
    )
    return engine


def get_session_factory():
    """Get session factory for database connections."""
    engine = get_engine()
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables."""
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    return engine


@contextmanager
def get_db_session():
    """Context manager for database sessions."""
    SessionLocal = get_session_factory()
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# Convenience function for direct access
def get_session() -> Session:
    """Get a database session."""
    SessionLocal = get_session_factory()
    return SessionLocal()


if __name__ == "__main__":
    print("Initializing database...")
    engine = init_db()
    print(f"Database initialized at: {DATABASE_URL}")
    print("Tables created:")
    for table in Base.metadata.tables:
        print(f"  - {table}")
