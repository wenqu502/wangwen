from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Idea, Work
from schemas import IdeaCreate, IdeaOut
from auth import get_current_user
from models import User

router = APIRouter()


@router.get("/work/{work_id}", response_model=List[IdeaOut])
def list_ideas(work_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return db.query(Idea).filter(Idea.work_id == work_id).all()


@router.post("", response_model=IdeaOut)
def create_idea(data: IdeaCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == data.work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    idea = Idea(**data.model_dump())
    db.add(idea)
    db.commit()
    db.refresh(idea)
    return idea


@router.put("/{idea_id}", response_model=IdeaOut)
def update_idea(idea_id: str, data: IdeaCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    idea = db.query(Idea).join(Work).filter(Idea.id == idea_id, Work.user_id == current_user.id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    for key, value in data.model_dump().items():
        setattr(idea, key, value)
    db.commit()
    db.refresh(idea)
    return idea


@router.delete("/{idea_id}")
def delete_idea(idea_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    idea = db.query(Idea).join(Work).filter(Idea.id == idea_id, Work.user_id == current_user.id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    db.delete(idea)
    db.commit()
    return {"success": True}
