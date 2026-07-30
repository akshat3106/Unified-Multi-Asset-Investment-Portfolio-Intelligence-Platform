import re

# This function cleans the text extracted from the pdf and make it more readable
def clean_text(text):
    text=re.sub(r"\s+", " ", text)
    text=text.strip()

    return text