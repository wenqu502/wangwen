from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


class WorkBase(BaseModel):
    id: str
    name: str
    genre: Optional[str] = None
    description: Optional[str] = None
    total_chapters: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class WorkCreate(BaseModel):
    id: str
    name: str
    genre: Optional[str] = None
    description: Optional[str] = None
    total_chapters: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class WorkOut(WorkBase):
    class Config:
        from_attributes = True


class Personality(BaseModel):
    keywords: List[str] = []
    surface: Optional[str] = None
    inner: Optional[str] = None
    stress_response: Optional[str] = None


class CharacterBase(BaseModel):
    id: str
    work_id: str
    name: str
    aliases: List[str] = []
    tags: List[str] = []
    appearance: Optional[str] = None
    personality: Optional[Personality] = None
    background: Optional[str] = None
    trauma: Optional[str] = None
    goals: Optional[str] = None
    arc: Optional[str] = None
    quotes: List[str] = []
    abilities: List[str] = []
    first_appearance: Optional[str] = None
    status: str = "alive"
    images: List[str] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CharacterCreate(CharacterBase):
    pass


class CharacterOut(CharacterBase):
    class Config:
        from_attributes = True


class Foreshadowing(BaseModel):
    id: str
    description: str
    status: str = "unresolved"


class Payoff(BaseModel):
    id: str
    description: str
    linked_foreshadowing: Optional[str] = None


class PlotNodeBase(BaseModel):
    id: str
    work_id: str
    title: str
    summary: Optional[str] = None
    content: Optional[str] = None
    type: str = "trunk"
    status: str = "todo"
    characters: List[str] = []
    location: Optional[str] = None
    tags: List[str] = []
    parent_ids: List[str] = []
    child_ids: List[str] = []
    condition: Optional[str] = None
    foreshadowing: List[Foreshadowing] = []
    payoff: List[Payoff] = []
    word_count_target: Optional[int] = None
    word_count_actual: Optional[int] = None
    position: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class PlotNodeCreate(PlotNodeBase):
    pass


class PlotNodeOut(PlotNodeBase):
    class Config:
        from_attributes = True


class RelationEdgeBase(BaseModel):
    id: str
    work_id: str
    source_id: str
    target_id: str
    type: str
    description: Optional[str] = None
    is_hidden: bool = False
    created_at: Optional[str] = None


class RelationEdgeCreate(RelationEdgeBase):
    pass


class RelationEdgeOut(RelationEdgeBase):
    class Config:
        from_attributes = True


class SystemBranch(BaseModel):
    id: str
    name: str
    levels: List[Dict[str, Any]] = []


class SystemRule(BaseModel):
    id: str
    description: str
    severity: str = "soft"
    exceptions: List[str] = []


class WorkSystemBase(BaseModel):
    id: str
    work_id: str
    name: str
    description: Optional[str] = None
    branches: List[SystemBranch] = []
    rules: List[SystemRule] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class WorkSystemCreate(WorkSystemBase):
    pass


class WorkSystemOut(WorkSystemBase):
    class Config:
        from_attributes = True


class IdeaBase(BaseModel):
    id: str
    work_id: str
    content: str
    tags: List[str] = []
    status: str = "pending"
    linked_entity: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None


class IdeaCreate(IdeaBase):
    pass


class IdeaOut(IdeaBase):
    class Config:
        from_attributes = True


class StoryEventBase(BaseModel):
    id: str
    work_id: str
    title: str
    description: Optional[str] = None
    type: str = "other"
    chapter_id: Optional[str] = None
    character_ids: List[str] = []
    timestamp: Optional[str] = None
    location: Optional[str] = None
    importance: int = 1
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class StoryEventCreate(StoryEventBase):
    pass


class StoryEventOut(StoryEventBase):
    class Config:
        from_attributes = True


class EventEdgeBase(BaseModel):
    id: str
    work_id: str
    source_id: str
    target_id: str
    type: str = "sequence"
    description: Optional[str] = None
    created_at: Optional[str] = None


class EventEdgeCreate(EventEdgeBase):
    pass


class EventEdgeOut(EventEdgeBase):
    class Config:
        from_attributes = True
