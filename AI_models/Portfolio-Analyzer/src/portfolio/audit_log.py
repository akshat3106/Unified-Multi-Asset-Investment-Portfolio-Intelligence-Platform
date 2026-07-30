# audit_log.py
import json
from datetime import datetime

LOG_FILE_PATH = "audit_log.jsonl"


def save_audit_entry(user_id, session_id, request_data, response_data):
    # Build one record containing everything about this request

    entry = {
        "timestamp": datetime.now().isoformat(),
        "user_id": user_id,
        "session_id": session_id,
        "request": request_data,
        "response": response_data,
    }

    # Convert the record to a JSON string
    entry_as_text = json.dumps(entry, default=str)

    # Open the file in "append" mode so old entries are never overwritten,
    # and add this new entry as one line at the end of the file.
    with open(LOG_FILE_PATH, "a") as file:
        file.write(entry_as_text + "\n")

def read_audit_log(user_id=None):
    # Reads all entries from the audit log file.
    # If user_id is given, only returns entries for that user.

    entries = []

    try:
        with open(LOG_FILE_PATH, "r") as file:
            for line in file:
                entry = json.loads(line)

                if user_id is None:
                    entries.append(entry)
                elif entry.get("user_id") == user_id:
                    entries.append(entry)

    except FileNotFoundError:
        # If the file doesn't exist yet, just return an empty list
        return []

    return entries