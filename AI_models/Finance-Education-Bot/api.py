from fastapi import FastAPI
from pydantic import BaseModel
from src.retriever import retrieve_context
from src.llm import generate_answer
from src.guardrails import check_guardrail

app=FastAPI()
chat_history={}
class Chat_request(BaseModel):
    session_id:str
    message:str

@app.get("/")
def home():
    return{
        "message":"Welcome to AssetBridge API."
    }

@app.post("/chat")
def chat(request: Chat_request):
    question=request.message

    if request.session_id not in chat_history:
        chat_history[request.session_id]=[]

    category = check_guardrail(question)

    if category == "investment_advice":
        answer = (
            "I cannot recommend specific stocks, mutual funds, or provide personalised investment advice. "
            "However, I can explain how different investment options work and the factors you should consider before investing."
        )
    elif category == "illegal_activity":
        answer = (
            "I cannot assist with illegal, fraudulent, or unethical financial activities. "
            "However, I can explain the legal consequences of such activities and how regulators like SEBI protect investors."
        )
    elif category == "prompt_injection":
        answer = (
            "I cannot ignore my safety instructions or change my role. "
            "I am designed to provide educational financial information based on my knowledge base."
        )
    else:
        answer = None

    if answer is not None:
        chat_history[request.session_id].append({"role": "user", "content": question})
        chat_history[request.session_id].append({"role": "assistant", "content": answer})
        return {"answer": answer}

    chat_history[request.session_id].append(
        {
            "role":"user",
            "content":question
        }
    )

    recent_turns = chat_history[request.session_id][-4:]
    search_query = "\n".join(f"{m['role']}: {m['content']}" for m in recent_turns)

    context_chunks=retrieve_context(search_query)
    context = "\n\n".join(context_chunks)
    answer = generate_answer(
        context=context,
        chat_history=chat_history[request.session_id]
    )

    chat_history[request.session_id].append(
        {
            "role": "assistant",
            "content": answer
        }
    )

    return{
        "answer": answer
    }