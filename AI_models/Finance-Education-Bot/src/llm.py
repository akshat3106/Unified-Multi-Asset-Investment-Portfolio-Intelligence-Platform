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
- Answer ONLY using the provided context.
- Explain financial concepts in simple language.
- Do not make up facts.
- Do not answer from your own knowledge.
- If the answer is not present in the context, reply exactly:

"I couldn't find this information in the provided documents."

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
    Use the following retrieved context to answer ONLY the latest user question.

    Retrieved Context:
    {context}

    If the answer cannot be found in the retrieved context, reply exactly:

    I couldn't find this information in the provided documents.
    """
        }
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0,messages=messages, stream=True)
        

    for chunk in response:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content