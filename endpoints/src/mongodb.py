import os

from dotenv import load_dotenv
from fastapi import Request
from pymongo import AsyncMongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "mydatabase")


async def connect(app):
    app.state.mongo_client = AsyncMongoClient(MONGO_URI)
    app.state.db = app.state.mongo_client[MONGO_DB_NAME]
    await app.state.mongo_client.admin.command("ping")


async def close(app):
    await app.state.mongo_client.close()


def get_db(request: Request):
    return request.app.state.db
