from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models import (
    Vehicle,
    Driver,
    Trip,
    FuelLog,
    MaintenanceLog,
    Expense,
)

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


# =====================================================
# DASHBOARD
# =====================================================

@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    return {
        "total_vehicles": db.query(Vehicle).count(),
        "available_vehicles": db.query(Vehicle).filter(
            Vehicle.status == "Available"
        ).count(),

        "vehicles_on_trip": db.query(Vehicle).filter(
            Vehicle.status == "On Trip"
        ).count(),

        "vehicles_in_shop": db.query(Vehicle).filter(
            Vehicle.status == "In Shop"
        ).count(),

        "total_drivers": db.query(Driver).count(),

        "available_drivers": db.query(Driver).filter(
            Driver.status == "Available"
        ).count(),

        "active_trips": db.query(Trip).filter(
            Trip.status == "Active"
        ).count(),

        "completed_trips": db.query(Trip).filter(
            Trip.status == "Completed"
        ).count(),
    }


# =====================================================
# FUEL REPORT
# =====================================================

@router.get("/fuel")
def fuel_report(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    total_liters = db.query(
        func.sum(FuelLog.liters)
    ).scalar() or 0

    total_cost = db.query(
        func.sum(FuelLog.cost)
    ).scalar() or 0

    average_cost = 0

    if total_liters > 0:
        average_cost = total_cost / total_liters

    return {
        "total_liters": total_liters,
        "total_cost": total_cost,
        "average_cost_per_liter": round(
            average_cost,
            2
        )
    }


# =====================================================
# MAINTENANCE REPORT
# =====================================================

@router.get("/maintenance")
def maintenance_report(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    total_cost = db.query(
        func.sum(MaintenanceLog.cost)
    ).scalar() or 0

    active = db.query(
        MaintenanceLog
    ).filter(
        MaintenanceLog.status == "Active"
    ).count()

    completed = db.query(
        MaintenanceLog
    ).filter(
        MaintenanceLog.status == "Completed"
    ).count()

    return {
        "total_maintenance_cost": total_cost,
        "active_repairs": active,
        "completed_repairs": completed
    }


# =====================================================
# EXPENSE REPORT
# =====================================================

@router.get("/expenses")
def expense_report(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    total_expense = db.query(
        func.sum(Expense.amount)
    ).scalar() or 0

    total_fuel = db.query(
        func.sum(FuelLog.cost)
    ).scalar() or 0

    total_maintenance = db.query(
        func.sum(MaintenanceLog.cost)
    ).scalar() or 0

    return {
        "fuel_cost": total_fuel,
        "maintenance_cost": total_maintenance,
        "other_expenses": total_expense,
        "overall_cost": (
            total_expense +
            total_fuel +
            total_maintenance
        )
    }


# =====================================================
# TRIP REPORT
# =====================================================

@router.get("/trips")
def trip_report(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    total_distance = db.query(
        func.sum(Trip.actual_distance)
    ).scalar() or 0

    total_fuel = db.query(
        func.sum(Trip.fuel_consumed)
    ).scalar() or 0

    total_trips = db.query(
        Trip
    ).count()

    efficiency = 0

    if total_fuel > 0:
        efficiency = total_distance / total_fuel

    return {
        "total_trips": total_trips,
        "total_distance": total_distance,
        "fuel_consumed": total_fuel,
        "average_efficiency": round(
            efficiency,
            2
        )
    }


# =====================================================
# VEHICLE UTILIZATION
# =====================================================

@router.get("/vehicle-utilization")
def vehicle_utilization(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    report = []

    vehicles = db.query(Vehicle).all()

    for vehicle in vehicles:

        trips = db.query(Trip).filter(
            Trip.vehicle_id == vehicle.id
        ).count()

        report.append(
            {
                "vehicle_id": vehicle.id,
                "vehicle_name": vehicle.vehicle_name,
                "registration": vehicle.registration_number,
                "status": vehicle.status,
                "trips_completed": trips,
                "odometer": vehicle.odometer,
            }
        )

    return report


# =====================================================
# DRIVER REPORT
# =====================================================

@router.get("/drivers")
def driver_report(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    report = []

    drivers = db.query(Driver).all()

    for driver in drivers:

        total_trips = db.query(Trip).filter(
            Trip.driver_id == driver.id
        ).count()

        report.append(
            {
                "driver_id": driver.id,
                "name": driver.name,
                "license": driver.license_number,
                "safety_score": driver.safety_score,
                "status": driver.status,
                "trips_completed": total_trips,
            }
        )

    return report