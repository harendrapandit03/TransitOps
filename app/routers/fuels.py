from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models import FuelLog, Vehicle
from app.schemas import FuelLogCreate, FuelLogResponse

router = APIRouter(
    prefix="/fuel",
    tags=["Fuel"],
)


# Add Fuel Log


@router.post(
    "/",
    response_model=FuelLogResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_fuel_log(
    fuel: FuelLogCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == fuel.vehicle_id)
        .first()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    fuel_log = FuelLog(
        vehicle_id=fuel.vehicle_id,
        liters=fuel.liters,
        cost=fuel.cost,
    )

    db.add(fuel_log)
    db.commit()
    db.refresh(fuel_log)

    return fuel_log


# Get All Fuel Logs


@router.get(
    "/",
    response_model=list[FuelLogResponse]
)
def get_all_fuel_logs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    return db.query(FuelLog).all()


# -------------------------------------------------------
# Get Fuel Log By ID
# -------------------------------------------------------

@router.get(
    "/{fuel_id}",
    response_model=FuelLogResponse
)
def get_fuel_log(
    fuel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    fuel_log = (
        db.query(FuelLog)
        .filter(FuelLog.id == fuel_id)
        .first()
    )

    if fuel_log is None:
        raise HTTPException(
            status_code=404,
            detail="Fuel log not found"
        )

    return fuel_log


# Delete Fuel Log


@router.delete("/{fuel_id}")
def delete_fuel_log(
    fuel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    fuel_log = (
        db.query(FuelLog)
        .filter(FuelLog.id == fuel_id)
        .first()
    )

    if fuel_log is None:
        raise HTTPException(
            status_code=404,
            detail="Fuel log not found"
        )

    db.delete(fuel_log)
    db.commit()

    return {
        "message": "Fuel log deleted successfully."
    }