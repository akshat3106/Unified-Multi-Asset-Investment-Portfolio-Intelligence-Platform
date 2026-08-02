# Generate emebeddings
from fastembed import TextEmbedding

print("Embedding module loaded. Model will load lazily via fastembed.")

_model = None

def get_model():
    global _model
    if _model is None:
        print("Loading embedding model (fastembed)...")
        _model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return _model

def generate_embeddings(chunks):
    model = get_model()
    # fastembed yields a generator of numpy arrays, convert to list of numpy arrays
    embeddings = list(model.embed(chunks))
    return embeddings