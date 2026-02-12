"""
Database service layer for business logic operations.

Handles user management, scenario CRUD, sharing, versioning, and audit logging.
"""

import json
from typing import Optional, List, Dict, Any
from datetime import datetime

from modules.database import (
    get_db_session, User, Scenario, ScenarioShare, ScenarioVersion,
    AuditLog, UserPreferences
)
from modules.auth import (
    hash_password, verify_password, generate_user_id, generate_scenario_id,
    create_user_dict, create_scenario_dict
)


# ============================================================================
# USER MANAGEMENT
# ============================================================================

def create_user(email: str, username: str, password: str, full_name: str = "") -> Dict[str, Any]:
    """
    Create a new user account.

    Args:
        email: User email
        username: Unique username
        password: Plain text password (will be hashed)
        full_name: User's full name

    Returns:
        User dictionary

    Raises:
        ValueError: If email or username already exists
    """
    with get_db_session() as session:
        # Check if email exists
        if session.query(User).filter(User.email == email).first():
            raise ValueError(f"Email {email} already exists")

        # Check if username exists
        if session.query(User).filter(User.username == username).first():
            raise ValueError(f"Username {username} already exists")

        # Create user
        user = User(
            id=generate_user_id(),
            email=email,
            username=username,
            password_hash=hash_password(password),
            full_name=full_name,
        )
        session.add(user)
        session.flush()

        # Create default preferences
        preferences = UserPreferences(
            id=generate_user_id(),
            user_id=user.id,
        )
        session.add(preferences)
        session.commit()

        return create_user_dict(user)


def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID."""
    with get_db_session() as session:
        user = session.query(User).filter(User.id == user_id).first()
        return create_user_dict(user) if user else None


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email."""
    with get_db_session() as session:
        user = session.query(User).filter(User.email == email).first()
        return create_user_dict(user) if user else None


def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Get user by username."""
    with get_db_session() as session:
        user = session.query(User).filter(User.username == username).first()
        return create_user_dict(user) if user else None


def authenticate_user(email: str, password: str) -> Optional[str]:
    """
    Authenticate user and return user_id if successful.

    Args:
        email: User email
        password: Plain text password

    Returns:
        User ID if authentication successful, None otherwise
    """
    with get_db_session() as session:
        user = session.query(User).filter(User.email == email).first()
        if user and verify_password(password, user.password_hash):
            return user.id
        return None


# ============================================================================
# SCENARIO MANAGEMENT
# ============================================================================

def create_scenario(
    user_id: str,
    name: str,
    household_data: Dict[str, Any],
    description: str = ""
) -> Dict[str, Any]:
    """
    Create a new scenario for a user.

    Args:
        user_id: Owner user ID
        name: Scenario name
        household_data: Household data dictionary
        description: Optional description

    Returns:
        Scenario dictionary
    """
    with get_db_session() as session:
        scenario = Scenario(
            id=generate_scenario_id(),
            owner_id=user_id,
            name=name,
            description=description,
            household_data=household_data,
            results_data=None,
        )
        session.add(scenario)

        # Create initial version
        version = ScenarioVersion(
            id=generate_scenario_id(),
            scenario_id=scenario.id,
            version_number=1,
            created_by_id=user_id,
            change_description="Initial version",
            household_data=household_data,
        )
        session.add(version)

        # Create audit log
        audit = AuditLog(
            id=generate_scenario_id(),
            user_id=user_id,
            scenario_id=scenario.id,
            action="create",
            details={"name": name},
        )
        session.add(audit)
        session.commit()

        return create_scenario_dict(scenario)


def get_scenario(scenario_id: str) -> Optional[Dict[str, Any]]:
    """Get scenario by ID (with full data)."""
    with get_db_session() as session:
        scenario = session.query(Scenario).filter(Scenario.id == scenario_id).first()
        if not scenario:
            return None

        return {
            **create_scenario_dict(scenario),
            "household_data": scenario.household_data,
            "results_data": scenario.results_data,
        }


def get_user_scenarios(user_id: str, include_archived: bool = False) -> List[Dict[str, Any]]:
    """
    Get all scenarios owned by a user.

    Args:
        user_id: User ID
        include_archived: Include archived scenarios

    Returns:
        List of scenario dictionaries
    """
    with get_db_session() as session:
        query = session.query(Scenario).filter(Scenario.owner_id == user_id)

        if not include_archived:
            query = query.filter(Scenario.is_archived == False)

        scenarios = query.order_by(Scenario.updated_at.desc()).all()
        return [create_scenario_dict(s) for s in scenarios]


def get_accessible_scenarios(user_id: str) -> List[Dict[str, Any]]:
    """
    Get all scenarios accessible to a user (owned or shared).

    Args:
        user_id: User ID

    Returns:
        List of scenario dictionaries
    """
    with get_db_session() as session:
        # Get owned scenarios
        owned = session.query(Scenario).filter(
            Scenario.owner_id == user_id,
            Scenario.is_archived == False
        ).all()

        # Get shared scenarios
        shares = session.query(Scenario).join(
            ScenarioShare, Scenario.id == ScenarioShare.scenario_id
        ).filter(
            ScenarioShare.shared_with_user_id == user_id,
            Scenario.is_archived == False
        ).all()

        # Combine and deduplicate
        all_scenarios = {s.id: s for s in owned + shares}.values()
        return [create_scenario_dict(s) for s in sorted(all_scenarios, key=lambda s: s.updated_at, reverse=True)]


def update_scenario(
    scenario_id: str,
    user_id: str,
    name: str = None,
    description: str = None,
    household_data: Dict[str, Any] = None,
    results_data: Dict[str, Any] = None,
    change_description: str = ""
) -> Dict[str, Any]:
    """
    Update a scenario (creates new version).

    Args:
        scenario_id: Scenario ID
        user_id: User making the change
        name: Updated name (optional)
        description: Updated description (optional)
        household_data: Updated household data (optional)
        results_data: Updated results (optional)
        change_description: Description of what changed

    Returns:
        Updated scenario dictionary

    Raises:
        ValueError: If user doesn't have edit permission
    """
    with get_db_session() as session:
        scenario = session.query(Scenario).filter(Scenario.id == scenario_id).first()
        if not scenario:
            raise ValueError(f"Scenario {scenario_id} not found")

        # Check permission (owner or editor)
        if not has_edit_permission(scenario_id, user_id):
            raise ValueError(f"User {user_id} doesn't have edit permission")

        # Update fields
        if name is not None:
            scenario.name = name
        if description is not None:
            scenario.description = description
        if household_data is not None:
            scenario.household_data = household_data
        if results_data is not None:
            scenario.results_data = results_data

        scenario.updated_at = datetime.utcnow()

        # Create new version if household data changed
        if household_data is not None:
            last_version = session.query(ScenarioVersion).filter(
                ScenarioVersion.scenario_id == scenario_id
            ).order_by(ScenarioVersion.version_number.desc()).first()

            next_version = (last_version.version_number + 1) if last_version else 1

            version = ScenarioVersion(
                id=generate_scenario_id(),
                scenario_id=scenario_id,
                version_number=next_version,
                created_by_id=user_id,
                change_description=change_description,
                household_data=household_data,
            )
            session.add(version)

        # Create audit log
        audit = AuditLog(
            id=generate_scenario_id(),
            user_id=user_id,
            scenario_id=scenario_id,
            action="update",
            details={"change_description": change_description},
        )
        session.add(audit)
        session.commit()

        return {
            **create_scenario_dict(scenario),
            "household_data": scenario.household_data,
            "results_data": scenario.results_data,
        }


def delete_scenario(scenario_id: str, user_id: str) -> bool:
    """
    Delete a scenario (only owner can delete).

    Args:
        scenario_id: Scenario ID
        user_id: User attempting to delete

    Returns:
        True if deleted, False otherwise

    Raises:
        ValueError: If user doesn't own the scenario
    """
    with get_db_session() as session:
        scenario = session.query(Scenario).filter(Scenario.id == scenario_id).first()
        if not scenario:
            raise ValueError(f"Scenario {scenario_id} not found")

        if scenario.owner_id != user_id:
            raise ValueError(f"User {user_id} cannot delete scenario owned by {scenario.owner_id}")

        # Create audit log before deletion
        audit = AuditLog(
            id=generate_scenario_id(),
            user_id=user_id,
            scenario_id=scenario_id,
            action="delete",
            details={"name": scenario.name},
        )
        session.add(audit)

        # Delete scenario (cascades to shares, versions, audit logs)
        session.delete(scenario)
        session.commit()

        return True


# ============================================================================
# SCENARIO SHARING
# ============================================================================

def share_scenario(scenario_id: str, owner_id: str, shared_with_email: str, permission_level: str = "viewer") -> Dict[str, Any]:
    """
    Share a scenario with another user.

    Args:
        scenario_id: Scenario to share
        owner_id: Owner of scenario
        shared_with_email: Email of user to share with
        permission_level: "viewer" or "editor"

    Returns:
        Share record dictionary

    Raises:
        ValueError: If scenario not found, user can't share, or target user not found
    """
    with get_db_session() as session:
        scenario = session.query(Scenario).filter(Scenario.id == scenario_id).first()
        if not scenario:
            raise ValueError(f"Scenario {scenario_id} not found")

        if scenario.owner_id != owner_id:
            raise ValueError(f"Only owner can share scenario")

        # Find target user
        target_user = session.query(User).filter(User.email == shared_with_email).first()
        if not target_user:
            raise ValueError(f"User {shared_with_email} not found")

        # Check if already shared
        existing = session.query(ScenarioShare).filter(
            ScenarioShare.scenario_id == scenario_id,
            ScenarioShare.shared_with_user_id == target_user.id
        ).first()

        if existing:
            # Update permission level
            existing.permission_level = permission_level
            session.commit()
        else:
            # Create new share
            share = ScenarioShare(
                id=generate_scenario_id(),
                scenario_id=scenario_id,
                shared_with_user_id=target_user.id,
                permission_level=permission_level,
                created_by_id=owner_id,
            )
            session.add(share)

            # Create audit log
            audit = AuditLog(
                id=generate_scenario_id(),
                user_id=owner_id,
                scenario_id=scenario_id,
                action="share",
                details={"shared_with": shared_with_email, "permission": permission_level},
            )
            session.add(audit)
            session.commit()

        return {
            "scenario_id": scenario_id,
            "shared_with": shared_with_email,
            "permission_level": permission_level,
        }


def get_scenario_shares(scenario_id: str) -> List[Dict[str, Any]]:
    """Get all shares for a scenario."""
    with get_db_session() as session:
        shares = session.query(ScenarioShare).filter(ScenarioShare.scenario_id == scenario_id).all()
        return [
            {
                "shared_with": s.shared_with_user.email,
                "permission_level": s.permission_level,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in shares
        ]


def revoke_scenario_share(scenario_id: str, owner_id: str, shared_with_email: str) -> bool:
    """Revoke a scenario share."""
    with get_db_session() as session:
        scenario = session.query(Scenario).filter(Scenario.id == scenario_id).first()
        if not scenario or scenario.owner_id != owner_id:
            raise ValueError("Not authorized")

        target_user = session.query(User).filter(User.email == shared_with_email).first()
        if not target_user:
            raise ValueError(f"User {shared_with_email} not found")

        share = session.query(ScenarioShare).filter(
            ScenarioShare.scenario_id == scenario_id,
            ScenarioShare.shared_with_user_id == target_user.id
        ).first()

        if share:
            session.delete(share)
            session.commit()
            return True
        return False


# ============================================================================
# PERMISSIONS
# ============================================================================

def has_view_permission(scenario_id: str, user_id: str) -> bool:
    """Check if user can view scenario."""
    with get_db_session() as session:
        scenario = session.query(Scenario).filter(Scenario.id == scenario_id).first()
        if not scenario:
            return False

        # Owner can view
        if scenario.owner_id == user_id:
            return True

        # Viewer or editor can view
        share = session.query(ScenarioShare).filter(
            ScenarioShare.scenario_id == scenario_id,
            ScenarioShare.shared_with_user_id == user_id
        ).first()
        return share is not None


def has_edit_permission(scenario_id: str, user_id: str) -> bool:
    """Check if user can edit scenario."""
    with get_db_session() as session:
        scenario = session.query(Scenario).filter(Scenario.id == scenario_id).first()
        if not scenario:
            return False

        # Owner can edit
        if scenario.owner_id == user_id:
            return True

        # Editor can edit
        share = session.query(ScenarioShare).filter(
            ScenarioShare.scenario_id == scenario_id,
            ScenarioShare.shared_with_user_id == user_id,
            ScenarioShare.permission_level == "editor"
        ).first()
        return share is not None


# ============================================================================
# VERSION HISTORY
# ============================================================================

def get_scenario_versions(scenario_id: str) -> List[Dict[str, Any]]:
    """Get version history for a scenario."""
    with get_db_session() as session:
        versions = session.query(ScenarioVersion).filter(
            ScenarioVersion.scenario_id == scenario_id
        ).order_by(ScenarioVersion.version_number).all()

        return [
            {
                "version_number": v.version_number,
                "created_by": v.created_by_user.username if v.created_by_user else "unknown",
                "created_at": v.created_at.isoformat() if v.created_at else None,
                "change_description": v.change_description,
            }
            for v in versions
        ]


def restore_scenario_version(scenario_id: str, version_number: int, user_id: str) -> Dict[str, Any]:
    """Restore scenario to a previous version."""
    with get_db_session() as session:
        scenario = session.query(Scenario).filter(Scenario.id == scenario_id).first()
        if not scenario:
            raise ValueError(f"Scenario {scenario_id} not found")

        if not has_edit_permission(scenario_id, user_id):
            raise ValueError("Not authorized")

        version = session.query(ScenarioVersion).filter(
            ScenarioVersion.scenario_id == scenario_id,
            ScenarioVersion.version_number == version_number
        ).first()

        if not version:
            raise ValueError(f"Version {version_number} not found")

        # Restore
        scenario.household_data = version.household_data
        scenario.updated_at = datetime.utcnow()

        # Create new version marking the restore
        last_version = session.query(ScenarioVersion).filter(
            ScenarioVersion.scenario_id == scenario_id
        ).order_by(ScenarioVersion.version_number.desc()).first()

        new_version = ScenarioVersion(
            id=generate_scenario_id(),
            scenario_id=scenario_id,
            version_number=(last_version.version_number + 1) if last_version else 1,
            created_by_id=user_id,
            change_description=f"Restored from version {version_number}",
            household_data=version.household_data,
        )
        session.add(new_version)

        # Create audit log
        audit = AuditLog(
            id=generate_scenario_id(),
            user_id=user_id,
            scenario_id=scenario_id,
            action="restore",
            details={"restored_from_version": version_number},
        )
        session.add(audit)
        session.commit()

        return {
            **create_scenario_dict(scenario),
            "household_data": scenario.household_data,
        }


# ============================================================================
# AUDIT LOGS
# ============================================================================

def get_audit_logs(scenario_id: str = None, user_id: str = None, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Get audit logs (filtered by scenario and/or user).

    Args:
        scenario_id: Optional scenario filter
        user_id: Optional user filter
        limit: Max results to return

    Returns:
        List of audit log records
    """
    with get_db_session() as session:
        query = session.query(AuditLog)

        if scenario_id:
            query = query.filter(AuditLog.scenario_id == scenario_id)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)

        logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()

        return [
            {
                "user": l.user.username if l.user else "unknown",
                "scenario": l.scenario.name if l.scenario else "unknown",
                "action": l.action,
                "details": l.details,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in logs
        ]
