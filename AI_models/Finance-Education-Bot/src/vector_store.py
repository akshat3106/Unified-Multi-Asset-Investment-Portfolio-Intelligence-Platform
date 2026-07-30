# Stores and retirves from ChromaDB
import chromadb

# client creation
client=chromadb.PersistentClient(path="chroma_db")

# formation of collection
collection=client.get_or_create_collection(
    name="finance_education"
)

# Document
def store_chunks(ids, chunks, embeddings):
    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings.tolist()
    )

# search embedding based on embedding of user query
def search_chunk(query_embedding, top_k=5):
    results=collection.query(
        query_embeddings=query_embedding.tolist(),
        n_results=top_k
    )

    return results

# This function reset the vector database
def reset_collection():
    global collection

    try:
        client.delete_collection("finance_education")
    except:
        pass

    collection=client.get_or_create_collection(
        name="finance_education"
    )