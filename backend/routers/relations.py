from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import RelationEdge, Work
from schemas import RelationEdgeCreate, RelationEdgeOut
from auth import get_current_user
from models import User

router = APIRouter()


@router.get("/work/{work_id}", response_model=List[RelationEdgeOut])
def list_relations(work_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return db.query(RelationEdge).filter(RelationEdge.work_id == work_id).all()


@router.post("", response_model=RelationEdgeOut)
def create_relation(data: RelationEdgeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == data.work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    edge = RelationEdge(**data.model_dump())
    db.add(edge)
    db.commit()
    db.refresh(edge)
    return edge


@router.put("/{edge_id}", response_model=RelationEdgeOut)
def update_relation(edge_id: str, data: RelationEdgeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    edge = db.query(RelationEdge).join(Work).filter(RelationEdge.id == edge_id, Work.user_id == current_user.id).first()
    if not edge:
        raise HTTPException(status_code=404, detail="Relation not found")
    for key, value in data.model_dump().items():
        setattr(edge, key, value)
    db.commit()
    db.refresh(edge)
    return edge


@router.delete("/{edge_id}")
def delete_relation(edge_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    edge = db.query(RelationEdge).join(Work).filter(RelationEdge.id == edge_id, Work.user_id == current_user.id).first()
    if not edge:
        raise HTTPException(status_code=404, detail="Relation not found")
    db.delete(edge)
    db.commit()
    return {"success": True}
