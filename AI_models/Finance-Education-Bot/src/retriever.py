# RAG pipelining execution

from .embedder import generate_embeddings
from .vector_store import search_chunk

def retrieve_context(query, top_k=5):
    query_embedding = generate_embeddings([query])

    results = search_chunk(
        query_embedding=query_embedding,
        top_k=top_k
    )

    return results["documents"][0]