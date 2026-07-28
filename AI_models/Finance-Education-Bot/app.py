from src.retriever import retrieve_context
from src.llm import generate_answer


def main():

    # print("=" * 60)
    # print("      AssetBridge - Financial Education Assistant")
    # print("Type 'exit' to quit.")
    # print("=" * 60)

    chat_history=[]
    while True:

        question = input("\nAsk your question: ").strip()

        if question.lower() == "exit":
            print("\nThank you for using AssetBridge!")
            break

        chat_history.append(
            {
                "role": "user",
                "content": question
            }
        )

        context_chunks = retrieve_context(question)

        if not context_chunks:
            print("\nI couldn't find any relevant information in the knowledge base.")
            continue

        context = "\n\n".join(context_chunks)

        answer = generate_answer(
            context=context,
            chat_history=chat_history
        )

        chat_history.append(
            {
                "role": "assistant",
                "content": answer
            }
        )

        # print("\nAnswer")
        # print("-" * 60)
        # print(answer)


if __name__ == "__main__":
    main()