
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router

app = FastAPI()

# Configure CORS - Allow production domain
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://zenithscores.com",
    "https://www.zenithscores.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Opportunity Engine API"}
