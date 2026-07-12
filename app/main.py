from fastapi import FastAPI
from app.database import engine, Base
from app import models
from app.routers import auth
from app.routers import vehicles
from app.routers import drivers
from app.routers import reports
from app.routers import trips
from app.routers import maintenance
from app.routers import fuels
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "TransitOps Backend Running 🚚"}

app.include_router(auth.router)
app.include_router(drivers.router)
app.include_router(maintenance.router)
app.include_router(fuels.router)
app.include_router(vehicles.router)
app.include_router(reports.router)
app.include_router(trips.router)
