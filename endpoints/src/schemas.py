from pydantic import BaseModel


class ItemIn(BaseModel):
    name: str
    price: float


class ItemOut(ItemIn):
    id: str
