# Generate emebeddings
from sentence_transformers import SentenceTransformer

print("Loading embedding model...")

model=SentenceTransformer("all-MiniLM-L6-v2")

def generate_embeddings(chunks):
    embeddings=model.encode(chunks)

    return embeddings