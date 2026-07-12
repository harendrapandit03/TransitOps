from datetime import datetime, UTC

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models import Vehicle, MaintenanceLog
from app.schemas import (
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse,
)

router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance"],
)


# Create Maintenance Log


@router.post(
    "/",
    response_model=MaintenanceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_maintenance_log(
    maintenance: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == maintenance.vehicle_id)
        .first()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    maintenance_log = MaintenanceLog(
        vehicle_id=maintenance.vehicle_id,
        issue=maintenance.issue,
        description=maintenance.description,
        cost=maintenance.cost,
    )

    vehicle.status = "In Shop"

    db.add(maintenance_log)
    db.commit()
    db.refresh(maintenance_log)

    return maintenance_log


# Get All Maintenance Logs


@router.get(
    "/",
    response_model=list[MaintenanceResponse]
)
def get_all_logs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    return db.query(MaintenanceLog).all()


# Get Maintenance By ID


@router.get(
    "/{maintenance_id}",
    response_model=MaintenanceResponse,
)
def get_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    maintenance = (
        db.query(MaintenanceLog)
        .filter(MaintenanceLog.id == maintenance_id)
        .first()
    )

    if maintenance is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance log not found"
        )

    return maintenance


# Update Maintenance


@router.put(
    "/{maintenance_id}",
    response_model=MaintenanceResponse,
)
def update_maintenance(
    maintenance_id: int,
    updated_data: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    maintenance = (
        db.query(MaintenanceLog)
        .filter(MaintenanceLog.id == maintenance_id)
        .first()
    )

    if maintenance is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance log not found"
        )

    data = updated_data.model_dump(exclude_unset=True)

    for key, value in data.items():
        setattr(maintenance, key, value)

    if maintenance.status.lower() == "completed":
        maintenance.closed_at = datetime.now(UTC)

        vehicle = (
            db.query(Vehicle)
            .filter(Vehicle.id == maintenance.vehicle_id)
            .first()
        )

        if vehicle:
            vehicle.status = "Available"

    db.commit()
    db.refresh(maintenance)

    return maintenance


# Delete Maintenance Log

@router.delete("/{maintenance_id}")
def delete_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    maintenance = (
        db.query(MaintenanceLog)
        .filter(MaintenanceLog.id == maintenance_id)
        .first()
    )

    if maintenance is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance log not found"
        )

    db.delete(maintenance)
    db.commit()

    return {
        "message": "Maintenance log deleted successfully."
    }