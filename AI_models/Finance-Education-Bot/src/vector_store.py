# Stores and retrieves from Qdrant
import os
import uuid
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

load_dotenv()

COLLECTION_NAME = "finance_education"
EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 output size

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)


def _ensure_collection():
    if not client.collection_exists(COLLECTION_NAME):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
        )


# Document
def store_chunks(ids, chunks, embeddings):
    _ensure_collection()

    points = [
        PointStruct(
            id=str(uuid.uuid5(uuid.NAMESPACE_URL, ids[idx])),
            vector=embeddings[idx].tolist(),
            payload={"text": chunks[idx], "chunk_id": ids[idx]},
        )
        for idx in range(len(chunks))
    ]

    client.upsert(collection_name=COLLECTION_NAME, points=points)


# search embedding based on embedding of user query
def search_chunk(query_embedding, top_k=5):
    _ensure_collection()

    hits = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding[0].tolist(),
        limit=top_k,
    ).points

    documents = [hit.payload["text"] for hit in hits]

    return {"documents": [documents]}


# This function resets the vector database
def reset_collection():
    if client.collection_exists(COLLECTION_NAME):
        client.delete_collection(COLLECTION_NAME)

    _ensure_collection()
