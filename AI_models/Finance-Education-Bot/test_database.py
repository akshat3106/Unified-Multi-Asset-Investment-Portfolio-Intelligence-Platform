import chromadb

client=chromadb.PersistentClient(path="chroma_db")

collection=client.get_collection("finance_education")

print("Total Chunks Stored:", collection.count())