from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Work
from schemas import WorkCreate, WorkOut
from auth import get_current_user
from models import User

router = APIRouter()


@router.get("", response_model=List[WorkOut])
def list_works(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Work).filter(Work.user_id == current_user.id).all()


@router.post("", response_model=WorkOut)
def create_work(data: WorkCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = Work(**data.model_dump(), user_id=current_user.id)
    db.add(work)
    db.commit()
    db.refresh(work)
    return work


@router.get("/{work_id}", response_model=WorkOut)
def get_work(work_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return work


@router.put("/{work_id}", response_model=WorkOut)
def update_work(work_id: str, data: WorkCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    for key, value in data.model_dump().items():
        setattr(work, key, value)
    db.commit()
    db.refresh(work)
    return work


@router.delete("/{work_id}")
def delete_work(work_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    db.delete(work)
    db.commit()
    return {"success": True}
