from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Character, Work
from schemas import CharacterCreate, CharacterOut
from auth import get_current_user
from models import User

router = APIRouter()


@router.get("/work/{work_id}", response_model=List[CharacterOut])
def list_characters(work_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return db.query(Character).filter(Character.work_id == work_id).all()


@router.post("", response_model=CharacterOut)
def create_character(data: CharacterCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == data.work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    char = Character(**data.model_dump())
    db.add(char)
    db.commit()
    db.refresh(char)
    return char


@router.put("/{char_id}", response_model=CharacterOut)
def update_character(char_id: str, data: CharacterCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    char = db.query(Character).join(Work).filter(Character.id == char_id, Work.user_id == current_user.id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    for key, value in data.model_dump().items():
        setattr(char, key, value)
    db.commit()
    db.refresh(char)
    return char


@router.delete("/{char_id}")
def delete_character(char_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    char = db.query(Character).join(Work).filter(Character.id == char_id, Work.user_id == current_user.id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    db.delete(char)
    db.commit()
    return {"success": True}
