from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models import User, Vehicle
from app.schemas import (
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse
)

# CREATE A NEW VEHICLE 
router = APIRouter(
    prefix = "/vehicles",
    tags = ['Vehicles']
)

@router.post(
    "/",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED
)
def create_vehicle(
        vehicle: VehicleCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
    ):
            if current_user.role != "Fleet Manager":
                raise HTTPException(
                    status_code=403,
                    detail="Only Fleet Managers can manage vehicles."
                )
            existing_vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.registration_number == vehicle.registration_number
            )
            .first()
            )

            if existing_vehicle:
                raise HTTPException(
                status_code=400,
                detail="Vehicle with this registration number already exists."
                )
            
            new_vehicle = Vehicle(
                registration_number=vehicle.registration_number,
                vehicle_name=vehicle.vehicle_name,
                vehicle_type=vehicle.vehicle_type,
                max_load_capacity=vehicle.max_load_capacity,
                odometer=vehicle.odometer,
                acquisition_cost=vehicle.acquisition_cost
            )

            db.add(new_vehicle)
            db.commit()
            db.refresh(new_vehicle)

            return new_vehicle

# GET ALL VEHICLES 
@router.get(
    "/",
    response_model=list[VehicleResponse]
)
def get_all_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    vehicles = db.query(Vehicle).all()

    return vehicles


# GET VEHICLE BY ID
@router.get(
    "/{vehicle_id}",
    response_model=VehicleResponse
)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    return vehicle
# UPDATE VEHICLE
@router.put(
    "/{vehicle_id}",
    response_model=VehicleResponse
)
def update_vehicle(
    vehicle_id: int,
    updated_vehicle: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Fleet Manager":
        raise HTTPException(
            status_code=403,
            detail="Only Fleet Managers can manage vehicles."
        )
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )
    update_data = updated_vehicle.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(vehicle, key, value)

    db.commit()
    db.refresh(vehicle)

    return vehicle

# DELETE VEHICLE
@router.delete(
    "/{vehicle_id}"
)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Fleet Manager":
        raise HTTPException(
            status_code=403,
            detail="Only Fleet Managers can manage vehicles."
        )
    
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )
    db.delete(vehicle)

    db.commit()

    return {
        "message": "Vehicle deleted successfully."
    }