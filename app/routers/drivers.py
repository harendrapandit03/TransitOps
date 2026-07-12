from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Driver
from app.schemas import (
    DriverCreate,
    DriverUpdate,
    DriverResponse,
)
from app.dependencies import get_db, get_current_user

router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"],
)



# Create Driver


@router.post(
    "/",
    response_model=DriverResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_driver(
    driver: DriverCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    existing_driver = (
        db.query(Driver)
        .filter(
            Driver.license_number == driver.license_number
        )
        .first()
    )

    if existing_driver:
        raise HTTPException(
            status_code=400,
            detail="Driver with this license already exists.",
        )

    new_driver = Driver(
        name=driver.name,
        license_number=driver.license_number,
        license_category=driver.license_category,
        license_expiry=driver.license_expiry,
        contact_number=driver.contact_number,
    )

    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)

    return new_driver


# Get All Drivers


@router.get(
    "/",
    response_model=list[DriverResponse],
)
def get_all_drivers(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    return db.query(Driver).all()



# Get Driver By ID


@router.get(
    "/{driver_id}",
    response_model=DriverResponse,
)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id)
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    return driver

# Update Driver


@router.put(
    "/{driver_id}",
    response_model=DriverResponse,
)
def update_driver(
    driver_id: int,
    updated_driver: DriverUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id)
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    update_data = updated_driver.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(driver, key, value)

    db.commit()
    db.refresh(driver)

    return driver


# Delete Driver


@router.delete("/{driver_id}")
def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id)
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    db.delete(driver)
    db.commit()

    return {
        "message": "Driver deleted successfully."
    }