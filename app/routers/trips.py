from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models import FuelLog
from app.dependencies import get_db, get_current_user
from app.models import User, Trip, Vehicle, Driver
from app.schemas import (
    TripCreate,
    TripResponse,
    TripUpdate,
    CompleteTrip
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
    # IF TRIP ALREADY DISPATCHED
    if trip.status != "Draft":
        raise HTTPException(
            status_code=400,
            detail="Only draft trips can be dispatched."
        )
    # CHANGE VEHICLE'S STATUS
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == trip.vehicle_id)
        .first()
    )
    # CHANGE DRIVER'S STATUS
    driver = (
        db.query(Driver)
        .filter(Driver.id == trip.driver_id)
        .first()
    )
    # DOUBLE CHECK 
    if vehicle.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Vehicle is not available."
        )
    if driver.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Driver is not available."
        )
    if driver.license_expiry < date.today():
        raise HTTPException(
            status_code=400,
            detail="Driver license has expired."
        )
    
    trip.status = "Dispatched"

    vehicle.status = "On Trip"

    driver.status = "On Trip"

    db.commit()

    db.refresh(trip)

    return trip

# GET ALL TRIPS
@router.get(
    "/",
    response_model=list[TripResponse]
)
def get_all_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    trips = db.query(Trip).all()

    return trips

# GET TRIP BY ID 

@router.get(
    "/{trip_id}",
    response_model=TripResponse
)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

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

    return trip

# COMPLETE A TRIP
@router.patch(
    "/{trip_id}/complete",
    response_model=TripResponse
)
def complete_trip(
    trip_id: int,
    data: CompleteTrip,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # RBAC
    if current_user.role != "Fleet Manager":
        raise HTTPException(
            status_code=403,
            detail="Only Fleet Managers can complete trips."
        )
    # FIND THE TRIP 
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
    
    if trip.status != "Dispatched":
        raise HTTPException(
            status_code=400,
            detail="Only dispatched trips can be completed."
        )
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == trip.vehicle_id)
        .first()
    )

    driver = (
        db.query(Driver)
        .filter(Driver.id == trip.driver_id)
        .first()
    )

    trip.actual_distance = data.actual_distance
    trip.fuel_consumed = data.fuel_consumed
    trip.status = "Completed"

    vehicle.status = "Available"
    vehicle.odometer = data.end_odometer

    driver.status = "Available"

    fuel_log = FuelLog(
        vehicle_id=vehicle.id,
        liters=data.fuel_consumed,
        cost=0
    )

    db.add(fuel_log)

    db.commit()

    db.refresh(trip)

    return trip