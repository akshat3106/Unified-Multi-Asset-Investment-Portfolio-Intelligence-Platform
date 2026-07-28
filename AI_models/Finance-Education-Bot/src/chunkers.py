# Splits text into meaningfull chunks
from langchain_text_splitters import RecursiveCharacterTextSplitter

def create_chunks(text,chunk_size=800,chunk_overlap=150):
    splitter=RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )

    chunks=splitter.split_text(text)

    return chunks