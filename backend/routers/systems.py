from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import WorkSystem, Work
from schemas import WorkSystemCreate, WorkSystemOut
from auth import get_current_user
from models import User

router = APIRouter()


@router.get("/work/{work_id}", response_model=List[WorkSystemOut])
def list_systems(work_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return db.query(WorkSystem).filter(WorkSystem.work_id == work_id).all()


@router.post("", response_model=WorkSystemOut)
def create_system(data: WorkSystemCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == data.work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    system = WorkSystem(**data.model_dump())
    db.add(system)
    db.commit()
    db.refresh(system)
    return system


@router.put("/{system_id}", response_model=WorkSystemOut)
def update_system(system_id: str, data: WorkSystemCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    system = db.query(WorkSystem).join(Work).filter(WorkSystem.id == system_id, Work.user_id == current_user.id).first()
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    for key, value in data.model_dump().items():
        setattr(system, key, value)
    db.commit()
    db.refresh(system)
    return system


@router.delete("/{system_id}")
def delete_system(system_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    system = db.query(WorkSystem).join(Work).filter(WorkSystem.id == system_id, Work.user_id == current_user.id).first()
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    db.delete(system)
    db.commit()
    return {"success": True}
