from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import PlotNode, Work
from schemas import PlotNodeCreate, PlotNodeOut
from auth import get_current_user
from models import User

router = APIRouter()


@router.get("/work/{work_id}", response_model=List[PlotNodeOut])
def list_plot_nodes(work_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return db.query(PlotNode).filter(PlotNode.work_id == work_id).all()


@router.post("", response_model=PlotNodeOut)
def create_plot_node(data: PlotNodeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == data.work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    node = PlotNode(**data.model_dump())
    db.add(node)
    db.commit()
    db.refresh(node)
    return node


@router.put("/{node_id}", response_model=PlotNodeOut)
def update_plot_node(node_id: str, data: PlotNodeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    node = db.query(PlotNode).join(Work).filter(PlotNode.id == node_id, Work.user_id == current_user.id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Plot node not found")
    for key, value in data.model_dump().items():
        setattr(node, key, value)
    db.commit()
    db.refresh(node)
    return node


@router.delete("/{node_id}")
def delete_plot_node(node_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    node = db.query(PlotNode).join(Work).filter(PlotNode.id == node_id, Work.user_id == current_user.id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Plot node not found")
    db.delete(node)
    db.commit()
    return {"success": True}
