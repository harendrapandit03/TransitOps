from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    DateTime,
    ForeignKey,
    Boolean
)
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, UTC


class User(Base):

    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

class Vehicle(Base):

    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String, unique=True, nullable=False)
    vehicle_name = Column(String, nullable=False)
    vehicle_type = Column(String, nullable=False)
    max_load_capacity = Column(Float, nullable=False)
    odometer = Column(Float, default=0)
    acquisition_cost = Column(Float, nullable=False)
    ## Available,On Trip,In Shop,Retired
    status = Column(String, default="Available")

    trips = relationship("Trip", back_populates="vehicle")

    maintenance_logs = relationship(
    "MaintenanceLog",
    back_populates="vehicle"
    )

    fuel_logs = relationship(
    "FuelLog",
    back_populates="vehicle"
    )

    expenses = relationship(
    "Expense",
    back_populates="vehicle"
    )
    
class Driver(Base):

    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)
    license_category = Column(String, nullable=False)
    license_expiry = Column(Date, nullable=False)
    contact_number = Column(String, nullable=False)
    safety_score = Column(Float, default=100)
    ## Available,On Trip,Off Duty,Suspended
    status = Column(String, default="Available")
    trips = relationship("Trip", back_populates="driver")
    

class Trip(Base):

    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    cargo_weight = Column(Float, nullable=False)
    planned_distance = Column(Float, nullable=False)
    actual_distance = Column(Float)
    fuel_consumed = Column(Float)
    status = Column(String, default="Draft")
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")

class MaintenanceLog(Base):

    __tablename__ = "maintenance_logs"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    issue = Column(String, nullable=False)
    description = Column(String)
    cost = Column(Float, default=0)
    status = Column(String, default="Active")
    opened_at = Column(DateTime,default=lambda: datetime.now(UTC))
    closed_at = Column(DateTime, nullable=True)
    vehicle = relationship("Vehicle", back_populates="maintenance_logs")

class FuelLog(Base):

    __tablename__ = "fuel_logs"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    liters = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    date = Column(DateTime, default=lambda: datetime.now(UTC))
    vehicle = relationship("Vehicle", back_populates="fuel_logs")

class Expense(Base):

    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    expense_type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String)
    date = Column(DateTime, default=lambda: datetime.now(UTC))
    vehicle = relationship("Vehicle", back_populates="expenses")