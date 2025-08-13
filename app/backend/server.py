from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models existants
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Projects
class ProjectIn(BaseModel):
    name: str
    description: str
    stars: int = 0
    forks: int = 0
    language: str
    topics: List[str] = []
    url: str
    homepage: Optional[str] = None
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    featured: Optional[bool] = False
    details: Optional[Dict[str, Any]] = None
    repoTree: Optional[List[Dict[str, Any]]] = None

class ProjectOut(BaseModel):
    id: str
    name: str
    description: str
    stars: int
    forks: int
    language: str
    topics: List[str]
    url: str
    homepage: Optional[str] = None
    updatedAt: datetime
    featured: Optional[bool] = False
    details: Optional[Dict[str, Any]] = None
    repoTree: Optional[List[Dict[str, Any]]] = None

class ContactIn(BaseModel):
    name: str
    email: EmailStr
    message: str

class ContactOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    message: str
    createdAt: datetime

@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(client_name=input.client_name)
    await db.status_checks.insert_one(status_obj.model_dump())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**sc) for sc in status_checks]

# Projects
@api_router.get("/projects")
async def get_projects(q: Optional[str] = Query(None), lang: Optional[str] = Query(None), sort: str = Query("updated")):
    query: Dict[str, Any] = {}
    if lang and lang.lower() != 'all':
        query["language"] = lang
    if q:
        regex = {"$regex": q, "$options": "i"}
        query["$or"] = [
            {"name": regex},
            {"description": regex},
            {"topics": regex},
        ]
    cursor = db.projects.find(query)
    if sort == 'stars':
        cursor = cursor.sort("stars", -1)
    elif sort == 'name':
        cursor = cursor.sort("name", 1)
    else:
        cursor = cursor.sort("updatedAt", -1)
    items = await cursor.to_list(1000)
    result = []
    for it in items:
        it["id"] = str(it.get("_id"))
        it.pop("_id", None)
        result.append(ProjectOut(**it))
    return {"items": result}

@api_router.get("/projects/featured")
async def get_featured_projects():
    items = await db.projects.find({"featured": True}).sort("updatedAt", -1).to_list(100)
    result = []
    for it in items:
        it["id"] = str(it.get("_id"))
        it.pop("_id", None)
        result.append(ProjectOut(**it))
    return {"items": result}

@api_router.post("/projects")
async def create_projects(payload: List[ProjectIn] | ProjectIn):
    docs = [p.model_dump() for p in (payload if isinstance(payload, list) else [payload])]
    for d in docs:
        if isinstance(d.get("updatedAt"), str):
            d["updatedAt"] = datetime.fromisoformat(d["updatedAt"].replace('Z','+00:00'))
    res = await db.projects.insert_many(docs)
    return {"inserted": len(res.inserted_ids)}

@api_router.get("/projects/{proj_id}", response_model=ProjectOut)
async def get_project(proj_id: str):
    try:
        _id = ObjectId(proj_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project id")
    it = await db.projects.find_one({"_id": _id})
    if not it:
        raise HTTPException(status_code=404, detail="Project not found")
    it["id"] = str(it.get("_id"))
    it.pop("_id", None)
    return ProjectOut(**it)

@api_router.put("/projects/{proj_id}")
async def update_project(proj_id: str, body: Dict[str, Any]):
    try:
        _id = ObjectId(proj_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project id")
    allowed = {"name","description","stars","forks","language","topics","url","homepage","updatedAt","featured","details","repoTree"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    if "updatedAt" in updates and isinstance(updates["updatedAt"], str):
        updates["updatedAt"] = datetime.fromisoformat(updates["updatedAt"].replace('Z','+00:00'))
    res = await db.projects.update_one({"_id": _id}, {"$set": updates})
    return {"updated": res.modified_count}

# Contact
@api_router.post("/contact", response_model=ContactOut)
async def create_contact(msg: ContactIn):
    obj = {
        "name": msg.name,
        "email": msg.email,
        "message": msg.message,
        "createdAt": datetime.utcnow(),
    }
    r = await db.contacts.insert_one(obj)
    out = ContactOut(id=str(r.inserted_id), **obj)
    return out

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_indexes_and_cleanup():
    """Deduplicate on url then ensure unique index on url to avoid duplicates."""
    try:
        seen = set()
        # Keep most recent by updatedAt
        cursor = db.projects.find({}, sort=[("updatedAt", -1)])
        async for doc in cursor:
            url = doc.get("url")
            if not url:
                continue
            if url in seen:
                await db.projects.delete_one({"_id": doc["_id"]})
            else:
                seen.add(url)
        await db.projects.create_index("url", unique=True, name="uniq_url")
        logger.info("Unique index on projects.url ensured.")
    except Exception as e:
        logger.warning(f"Index ensure encountered: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()