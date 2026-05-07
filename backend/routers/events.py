from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import StoryEvent, EventEdge, Work
from schemas import StoryEventCreate, StoryEventOut, EventEdgeCreate, EventEdgeOut
from auth import get_current_user
from models import User

router = APIRouter()


@router.get("/work/{work_id}", response_model=List[StoryEventOut])
def list_events(work_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return db.query(StoryEvent).filter(StoryEvent.work_id == work_id).all()


@router.post("", response_model=StoryEventOut)
def create_event(data: StoryEventCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == data.work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    event = StoryEvent(**data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.put("/{event_id}", response_model=StoryEventOut)
def update_event(event_id: str, data: StoryEventCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    event = db.query(StoryEvent).join(Work).filter(StoryEvent.id == event_id, Work.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for key, value in data.model_dump().items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}")
def delete_event(event_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    event = db.query(StoryEvent).join(Work).filter(StoryEvent.id == event_id, Work.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    # 级联删除事件边
    db.query(EventEdge).filter((EventEdge.source_id == event_id) | (EventEdge.target_id == event_id)).delete()
    db.delete(event)
    db.commit()
    return {"success": True}


@router.get("/edges/work/{work_id}", response_model=List[EventEdgeOut])
def list_event_edges(work_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return db.query(EventEdge).filter(EventEdge.work_id == work_id).all()


@router.post("/edges", response_model=EventEdgeOut)
def create_event_edge(data: EventEdgeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == data.work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    edge = EventEdge(**data.model_dump())
    db.add(edge)
    db.commit()
    db.refresh(edge)
    return edge


@router.put("/edges/{edge_id}", response_model=EventEdgeOut)
def update_event_edge(edge_id: str, data: EventEdgeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    edge = db.query(EventEdge).join(Work).filter(EventEdge.id == edge_id, Work.user_id == current_user.id).first()
    if not edge:
        raise HTTPException(status_code=404, detail="Event edge not found")
    for key, value in data.model_dump().items():
        setattr(edge, key, value)
    db.commit()
    db.refresh(edge)
    return edge


@router.delete("/edges/{edge_id}")
def delete_event_edge(edge_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    edge = db.query(EventEdge).join(Work).filter(EventEdge.id == edge_id, Work.user_id == current_user.id).first()
    if not edge:
        raise HTTPException(status_code=404, detail="Event edge not found")
    db.delete(edge)
    db.commit()
    return {"success": True}
