from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Work(Base):
    __tablename__ = 'works'

    id = Column(String(36), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    name = Column(String(255), nullable=False)
    genre = Column(String(100))
    description = Column(Text)
    total_chapters = Column(Integer)
    created_at = Column(String(50))
    updated_at = Column(String(50))


class Character(Base):
    __tablename__ = 'characters'

    id = Column(String(36), primary_key=True)
    work_id = Column(String(36), ForeignKey('works.id'), nullable=False)
    name = Column(String(255), nullable=False)
    aliases = Column(JSON, default=list)
    tags = Column(JSON, default=list)
    appearance = Column(Text)
    personality = Column(JSON)
    background = Column(Text)
    trauma = Column(Text)
    goals = Column(Text)
    arc = Column(Text)
    quotes = Column(JSON, default=list)
    abilities = Column(JSON, default=list)
    first_appearance = Column(String(50))
    status = Column(String(20), default='alive')
    images = Column(JSON, default=list)
    created_at = Column(String(50))
    updated_at = Column(String(50))


class PlotNode(Base):
    __tablename__ = 'plot_nodes'

    id = Column(String(36), primary_key=True)
    work_id = Column(String(36), ForeignKey('works.id'), nullable=False)
    title = Column(String(500), nullable=False)
    summary = Column(Text)
    content = Column(Text)
    type = Column(String(20), default='trunk')
    status = Column(String(20), default='todo')
    characters = Column(JSON, default=list)
    location = Column(String(255))
    tags = Column(JSON, default=list)
    parent_ids = Column(JSON, default=list)
    child_ids = Column(JSON, default=list)
    condition = Column(Text)
    foreshadowing = Column(JSON, default=list)
    payoff = Column(JSON, default=list)
    word_count_target = Column(Integer)
    word_count_actual = Column(Integer)
    position = Column(JSON)
    created_at = Column(String(50))
    updated_at = Column(String(50))


class RelationEdge(Base):
    __tablename__ = 'relation_edges'

    id = Column(String(36), primary_key=True)
    work_id = Column(String(36), ForeignKey('works.id'), nullable=False)
    source_id = Column(String(36), nullable=False)
    target_id = Column(String(36), nullable=False)
    type = Column(String(100), nullable=False)
    description = Column(Text)
    is_hidden = Column(String(10), default='false')
    created_at = Column(String(50))


class WorkSystem(Base):
    __tablename__ = 'work_systems'

    id = Column(String(36), primary_key=True)
    work_id = Column(String(36), ForeignKey('works.id'), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    branches = Column(JSON, default=list)
    rules = Column(JSON, default=list)
    created_at = Column(String(50))
    updated_at = Column(String(50))


class Idea(Base):
    __tablename__ = 'ideas'

    id = Column(String(36), primary_key=True)
    work_id = Column(String(36), ForeignKey('works.id'), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(JSON, default=list)
    status = Column(String(20), default='pending')
    linked_entity = Column(JSON)
    created_at = Column(String(50))


class StoryEvent(Base):
    __tablename__ = 'story_events'

    id = Column(String(36), primary_key=True)
    work_id = Column(String(36), ForeignKey('works.id'), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    type = Column(String(20), default='other')
    chapter_id = Column(String(36))
    character_ids = Column(JSON, default=list)
    timestamp = Column(String(50))
    location = Column(String(255))
    importance = Column(Integer, default=1)
    created_at = Column(String(50))
    updated_at = Column(String(50))


class EventEdge(Base):
    __tablename__ = 'event_edges'

    id = Column(String(36), primary_key=True)
    work_id = Column(String(36), ForeignKey('works.id'), nullable=False)
    source_id = Column(String(36), nullable=False)
    target_id = Column(String(36), nullable=False)
    type = Column(String(20), default='sequence')
    description = Column(Text)
    created_at = Column(String(50))
