from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict


# USER SCHEMAS

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


# VEHICLE SCHEMAS


class VehicleCreate(BaseModel):
    registration_number: str
    vehicle_name: str
    vehicle_type: str
    max_load_capacity: float
    odometer: float
    acquisition_cost: float


class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = None
    vehicle_name: Optional[str] = None
    vehicle_type: Optional[str] = None
    max_load_capacity: Optional[float] = None
    odometer: Optional[float] = None
    acquisition_cost: Optional[float] = None
    status: Optional[str] = None


class VehicleResponse(BaseModel):
    id: int
    registration_number: str
    vehicle_name: str
    vehicle_type: str
    max_load_capacity: float
    odometer: float
    acquisition_cost: float
    status: str

    model_config = ConfigDict(from_attributes=True)


# DRIVER SCHEMAS


class DriverCreate(BaseModel):
    name: str
    license_number: str
    license_category: str
    license_expiry: date
    contact_number: str


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry: Optional[date] = None
    contact_number: Optional[str] = None
    safety_score: Optional[float] = None
    status: Optional[str] = None


class DriverResponse(BaseModel):
    id: int
    name: str
    license_number: str
    license_category: str
    license_expiry: date
    contact_number: str
    safety_score: float
    status: str

    model_config = ConfigDict(from_attributes=True)


# TRIP SCHEMAS


class TripCreate(BaseModel):
    vehicle_id: int
    driver_id: int
    source: str
    destination: str
    cargo_weight: float
    planned_distance: float


class TripUpdate(BaseModel):
    actual_distance: Optional[float] = None
    fuel_consumed: Optional[float] = None
    status: Optional[str] = None


class TripResponse(BaseModel):
    id: int
    vehicle_id: int
    driver_id: int
    source: str
    destination: str
    cargo_weight: float
    planned_distance: float
    actual_distance: Optional[float]
    fuel_consumed: Optional[float]
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CompleteTrip(BaseModel):
    fuel_consumed: float
    end_odometer: float
    fuel_cost:float

# MAINTENANCE SCHEMAS


class MaintenanceCreate(BaseModel):
    vehicle_id: int
    issue: str
    description: Optional[str] = None
    cost: float


class MaintenanceUpdate(BaseModel):
    issue: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[float] = None
    status: Optional[str] = None
    closed_at: Optional[datetime] = None


class MaintenanceResponse(BaseModel):
    id: int
    vehicle_id: int
    issue: str
    description: Optional[str]
    cost: float
    status: str
    opened_at: datetime
    closed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


# FUEL LOG SCHEMAS


class FuelLogCreate(BaseModel):
    vehicle_id: int
    liters: float
    cost: float


class FuelLogResponse(BaseModel):
    id: int
    vehicle_id: int
    liters: float
    cost: float
    date: datetime

    model_config = ConfigDict(from_attributes=True)


# EXPENSE SCHEMAS


class ExpenseCreate(BaseModel):
    vehicle_id: int
    expense_type: str
    amount: float
    description: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: int
    vehicle_id: int
    expense_type: str
    amount: float
    description: Optional[str]
    date: datetime

    model_config = ConfigDict(from_attributes=True)
