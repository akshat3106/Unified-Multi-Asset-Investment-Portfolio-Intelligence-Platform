INVESTMENT_ADVICE_KEYWORDS = [
    "which stock",
    "buy stock",
    "sell stock",
    "recommend",
    "best stock",
    "best mutual fund",
    "which mutual fund",
    "where should i invest",
    "where to invest",
    "should i invest",
    "what should i invest",
    "top stocks",
    "top mutual funds",
    "multibagger",
    "guaranteed return",
    "double my money",
    "crypto to buy",
    "stock to buy"
]

ILLEGAL_ACTIVITY_KEYWORDS = [
    "insider trading",
    "manipulate stock",
    "pump and dump",
    "avoid tax",
    "hide black money",
    "fake kyc",
    "money laundering",
    "commit fraud",
    "hack bank",
    "hack zerodha",
    "steal money",
    "bypass sebi"
]

PROMPT_INJECTION_KEYWORDS = [
    "ignore previous instructions",
    "ignore all instructions",
    "forget your instructions",
    "forget previous instructions",
    "forget system prompt",
    "ignore system prompt",
    "pretend you are",
    "you are chatgpt",
    "act as",
    "answer using your own knowledge",
    "ignore the context",
    "jailbreak"
    "disregard"
]




def check_guardrail(question: str):

    question = question.lower()

    for keyword in INVESTMENT_ADVICE_KEYWORDS:
        if keyword in question:
            return "investment_advice"

    for keyword in ILLEGAL_ACTIVITY_KEYWORDS:
        if keyword in question:
            return "illegal_activity"

    for keyword in PROMPT_INJECTION_KEYWORDS:
        if keyword in question:
            return "prompt_injection"
    return None