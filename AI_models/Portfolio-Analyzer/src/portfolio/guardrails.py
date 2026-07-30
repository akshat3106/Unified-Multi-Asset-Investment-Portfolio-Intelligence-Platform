# guardrails.py

# List of words that we don't want in our AI generated recommendations.
# These words can make the app sound like it is giving investment advice,
# which is not allowed as per SEBI rules.

BANNED_WORDS = [
    "buy",
    "sell",
    "guaranteed",
    "guarantee",
    "sure returns",
    "safe investment",
    "best investment",
    "risk free",
    "assured returns",
    "will outperform",
    "definitely",
    "will double",
    "multibagger",
]


def find_banned_words(text):
    # This function checks one string of text and returns
    # a list of banned words found in it.

    found_words = []
    text_lower = text.lower()

    for word in BANNED_WORDS:
        if word in text_lower:
            found_words.append(word)

    return found_words


def check_text(text):
    # Returns True if text is safe (no banned words), False if not safe.
    # Also returns the list of banned words found.

    banned_found = find_banned_words(text)

    if len(banned_found) == 0:
        is_safe = True
    else:
        is_safe = False

    return is_safe, banned_found


def sanitize_text(text):
    # Replaces every banned word found in the text with [redacted]

    clean_text = text

    for word in BANNED_WORDS:
        if word in clean_text.lower():
            # simple case-insensitive replace
            index = clean_text.lower().find(word)
            while index != -1:
                clean_text = clean_text[:index] + "[redacted]" + clean_text[index + len(word):]
                index = clean_text.lower().find(word)

    return clean_text


def validate_recommendation_output(overall_summary, recommendations):
    # Checks the summary and all recommendations for banned words.
    # Returns a dictionary showing whether everything is safe,
    # and which parts had problems.

    violations = {}

    summary_safe, summary_words = check_text(overall_summary)
    if not summary_safe:
        violations["overall_summary"] = summary_words

    recommendation_violations = {}
    for i in range(len(recommendations)):
        rec_safe, rec_words = check_text(recommendations[i])
        if not rec_safe:
            recommendation_violations[i] = rec_words

    if len(recommendation_violations) > 0:
        violations["recommendations"] = recommendation_violations

    if len(violations) == 0:
        is_safe = True
    else:
        is_safe = False

    return {
        "is_safe": is_safe,
        "violations": violations,
    }