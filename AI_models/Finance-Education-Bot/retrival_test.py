from src.embedder import generate_embeddings
from src.vector_store import search_chunk

query = "What is a REIT?"

query_embedding = generate_embeddings([query])

results = search_chunk(query_embedding, top_k=2)

for i, chunk in enumerate(results["documents"][0], start=1):
    print(f"\nResult {i}")
    print("-" * 50)
    print(chunk[:500])