from fastapi import FastAPI
from app.routers import auth
from app.database import engine, Base
from app import models

app = FastAPI()

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "TransitOps Backend Running 🚚"}

app.include_router(auth.router)