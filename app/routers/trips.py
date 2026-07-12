from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models import User, Trip, Vehicle, Driver
from app.schemas import (
    TripCreate,
    TripResponse,
    TripUpdate
)

router = APIRouter(
    prefix="/trips",
    tags=["Trips"]
)

# CREATE A TRIP
@router.post(
    "/",
    response_model=TripResponse,
    status_code=status.HTTP_201_CREATED
)
def create_trip(
    trip: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # RBAC
    if current_user.role != "Fleet Manager":
        raise HTTPException(
            status_code=403,
            detail="Only Fleet Managers can create trips."
        )
    # CHECK FOR VEHICLE'S EXISTENCE 
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == trip.vehicle_id)
        .first()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )
    # DRIVER'S EXISTENCE 
    driver = (
        db.query(Driver)
        .filter(Driver.id == trip.driver_id)
        .first()
    )

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found."
        )
    
    # VEHICLE AVAILABILITY
    if vehicle.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Vehicle is not available."
        )
    # DRIVER AVAILABILITY
    if driver.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Driver is not available."
        )
    # LICENCE EXPIRY
    if driver.license_expiry < date.today():
        raise HTTPException(
            status_code=400,
            detail="Driver license has expired."
        )
    # OVERWEIGHT CHECK
    if trip.cargo_weight > vehicle.max_load_capacity:
        raise HTTPException(
            status_code=400,
            detail="Cargo exceeds vehicle capacity."
        )
    
    new_trip = Trip(
        vehicle_id=trip.vehicle_id,
        driver_id=trip.driver_id,
        source=trip.source,
        destination=trip.destination,
        cargo_weight=trip.cargo_weight,
        planned_distance=trip.planned_distance
    )

    db.add(new_trip)

    db.commit()

    db.refresh(new_trip)

    return new_trip

# DISPATCH A TRIP
@router.patch(
    "/{trip_id}/dispatch",
    response_model=TripResponse
)
def dispatch_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # RBAC
    if current_user.role != "Fleet Manager":
        raise HTTPException(
            status_code=403,
            detail="Only Fleet Managers can dispatch trips."
        )
    # TRIP EXISTENCE
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id)
        .first()
    )

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found."
        )
    # IF TRIP A
    if trip.status != "Draft":
        raise HTTPException(
            status_code=400,
            detail="Only draft trips can be dispatched."
        )