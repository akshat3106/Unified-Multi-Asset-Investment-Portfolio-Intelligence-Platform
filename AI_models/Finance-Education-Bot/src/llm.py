#LLM call

import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()


client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


SYSTEM_PROMPT = """
You are AssetBridge, an AI Financial Education Assistant developed for the SEBI Hackathon.

Your responsibilities:
- Prioritize using the provided retrieved context to answer the user's question. If the information is present in the context, you MUST use it as your primary source.
- If the retrieved context does not contain the answer, is irrelevant, or is empty, you may answer using your own general financial and regulatory knowledge instead.
- If you answer using your own general knowledge because the information was not in the provided documents, you MUST append a brief note at the end of your response, e.g.: "(Note: This response is based on general financial knowledge, as the details were not present in the provided documents.)"
- Do not make up facts, statistics, or figures.

Never provide investment advice, stock recommendations, return predictions, or guarantees.

Always keep your answers factual, concise, and easy to understand.

If multiple pieces of context are provided, combine the relevant information into one coherent answer.

Do not mention "the provided context" or "the document says" unless the user explicitly asks for the source.

If the context contains conflicting information, state that the documents contain differing information instead of choosing one.
"""



def generate_answer(context,chat_history):

    messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                }]

    messages.extend(chat_history[-6:])

    messages.append(
        {
            "role": "system",
            "content": f"""
    Use the following retrieved context to answer the latest user question.

    Retrieved Context:
    {context}

    Remember: Prioritize the retrieved context. Only if the information is not present in the retrieved context, answer using your general knowledge and add the note.
    """
        }
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0,messages=messages, stream=True)
        

    for chunk in response:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content