from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from mongodb import get_db
from schemas import ItemIn, ItemOut

router = APIRouter(prefix="/items", tags=["items"])


@router.post("", response_model=ItemOut, status_code=201)
async def create_item(item: ItemIn, db=Depends(get_db)):
    result = await db.items.insert_one(item.model_dump())
    return ItemOut(id=str(result.inserted_id), **item.model_dump())


@router.get("/{item_id}", response_model=ItemOut)
async def get_item(item_id: str, db=Depends(get_db)):
    if not ObjectId.is_valid(item_id):
        raise HTTPException(400, "ID invalide")
    doc = await db.items.find_one({"_id": ObjectId(item_id)})
    if doc is None:
        raise HTTPException(404, "Item introuvable")
    return ItemOut(id=str(doc["_id"]), name=doc["name"], price=doc["price"])


@router.get("", response_model=list[ItemOut])
async def list_items(db=Depends(get_db)):
    return [
        ItemOut(id=str(d["_id"]), name=d["name"], price=d["price"])
        async for d in db.items.find()
    ]