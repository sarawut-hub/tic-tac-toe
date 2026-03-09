
QUESTIONS = [
    {
        "id": 1,
        "question": "What is the capital of Thailand?",
        "options": ["Chiang Mai", "Phuket", "Bangkok", "Pattaya"],
        "answer": 2
    },
    {
        "id": 2,
        "question": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"],
        "answer": 1
    },
    {
        "id": 3,
        "question": "Which planet is known as the Red Planet?",
        "options": ["Earth", "Mars", "Jupiter", "Venus"],
        "answer": 1
    },
    {
        "id": 4,
        "question": "Who wrote 'Hamlet'?",
        "options": ["Charles Dickens", "J.K. Rowling", "William Shakespeare", "Mark Twain"],
        "answer": 2
    },
    {
         "id": 5,
         "question": "Which language is used for React?",
         "options": ["Python", "Java", "TypeScript/JavaScript", "C#"],
         "answer": 2
    }
]

def get_question_by_id(q_id):
    for q in QUESTIONS:
        if q["id"] == q_id:
            return q
    return None
