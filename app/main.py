from fastapi import FastAPI
from app.routers import auth
from app.database import engine, Base
from app.routers import vehicles
from app import models
from app.routers import drivers
from app.routers import maintenance
from app.routers import fuels

app = FastAPI()
Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "TransitOps Backend Running 🚚"}

app.include_router(auth.router)
app.include_router(drivers.router)
app.include_router(maintenance.router)
app.include_router(fuels.router)
