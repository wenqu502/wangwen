from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from auth import get_current_user
from models import User

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="WangWen API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from routers import auth, works, characters, plot_nodes, relations, systems, ideas, events

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(works.router, prefix="/api/works", tags=["works"])
app.include_router(characters.router, prefix="/api/characters", tags=["characters"])
app.include_router(plot_nodes.router, prefix="/api/plot-nodes", tags=["plot-nodes"])
app.include_router(relations.router, prefix="/api/relations", tags=["relations"])
app.include_router(systems.router, prefix="/api/systems", tags=["systems"])
app.include_router(ideas.router, prefix="/api/ideas", tags=["ideas"])
app.include_router(events.router, prefix="/api/events", tags=["events"])


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "email": current_user.email}
