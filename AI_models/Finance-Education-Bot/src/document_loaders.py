# PDF to Plain Text (Markdown-aware, table-safe)
from pathlib import Path
import pymupdf4llm

# This function extracts text from the pdf and uses path of the pdf to react the requierd pdf
def extarct_pdf_text(pdf_path):
    text = pymupdf4llm.to_markdown(str(pdf_path))
    return text

# This function reads every pdf and plain-text file
def load_document(data_folder):
    documents=[]

    for pdf_file in Path(data_folder).rglob("*.pdf"):  #Go inside data_folder and recursively (r) search (glob) for every file ending with .pdf.
        text=extarct_pdf_text(pdf_file)

        documents.append({
            "file_name":pdf_file.name,
            "file_path":str(pdf_file),
            "text":text
        })

    for txt_file in Path(data_folder).rglob("*.txt"):
        text=txt_file.read_text(encoding="utf-8")

        documents.append({
            "file_name":txt_file.name,
            "file_path":str(txt_file),
            "text":text
        })

    return documents