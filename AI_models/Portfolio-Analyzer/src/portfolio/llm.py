from groq import Groq, APIError
import json
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

MODEL_NAME="llama-3.3-70b-versatile"

def generate_recommendations_from_llm(
    prompt: str,
) -> dict:
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": prompt,
                }
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )

        if response.choices[0].message.content is None:
            raise RuntimeError("LLM returned an empty response.")

        content = response.choices[0].message.content

        return json.loads(content) 
    #.loads() convert json to# Convert JSON string returned by the LLM into a Python dictionary. text

    except APIError as e:
        raise RuntimeError(f"Groq API Error: {e}")

    except json.JSONDecodeError:
        raise RuntimeError(
                "LLM returned an invalid JSON response."
            )

    except Exception as e:
        raise RuntimeError(
                f"Unexpected error while generating recommendations: {e}"
            )
