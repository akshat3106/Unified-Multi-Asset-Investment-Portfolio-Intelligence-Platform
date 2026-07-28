from src.document_loaders import load_document
from src.chunkers import create_chunks
from src.text_cleaner import clean_text
from src.embedder import generate_embeddings
from src.vector_store import store_chunks, reset_collection
from pathlib import Path

reset_collection()

documents=load_document("data")

for document in documents:
    # print(document["file_name"])
    cleaned_text=clean_text(document["text"])

    chunks=create_chunks(cleaned_text)

    # print(f"Total Chunks:{len(chunks)}")

    # creating ids of chunks
    file_name=Path(document["file_name"]).stem
    ids=[]

    for i in range(len(chunks)):
        ids.append(f"{document['file_name']}_{i}")

    embeddings=generate_embeddings(chunks)

    store_chunks(ids, chunks, embeddings)