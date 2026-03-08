from pydantic import BaseModel
from typing import List, Optional

class RepositoryInfo(BaseModel):
    name: str

class FileEntry(BaseModel):
    name: str
    is_dir: bool
    size: int
    commit_hash: Optional[str] = None

class FileContent(BaseModel):
    path: str
    content: str
    repo_name: str
    ref: str
