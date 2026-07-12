from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models import Expense, Vehicle
from app.schemas import ExpenseCreate, ExpenseResponse

router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"],
)


# Add Expense


@router.post(
    "/",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == expense.vehicle_id)
        .first()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    new_expense = Expense(
        vehicle_id=expense.vehicle_id,
        expense_type=expense.expense_type,
        amount=expense.amount,
        description=expense.description,
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return new_expense


# Get All Expenses


@router.get(
    "/",
    response_model=list[ExpenseResponse]
)
def get_all_expenses(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    return db.query(Expense).all()


# Get Expense By ID


@router.get(
    "/{expense_id}",
    response_model=ExpenseResponse,
)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id)
        .first()
    )

    if expense is None:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    return expense


# Delete Expense


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id)
        .first()
    )

    if expense is None:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    db.delete(expense)
    db.commit()

    return {
        "message": "Expense deleted successfully."
    }
