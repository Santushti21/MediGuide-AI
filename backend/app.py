import os
import json
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from pymongo import MongoClient


load_dotenv()

mongo_uri = os.getenv("MONGODB_URI")

mongo_client = MongoClient(mongo_uri)
db = mongo_client["mediguide"]
chat_collection = db["chat_history"]
notes_collection = db["health_notes"]
tasks_collection = db["health_tasks"]


app = FastAPI(title="MediGuide AI")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "https://mediguide-ai-1-17mv.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


api_key = os.getenv("GROQ_API_KEY")

client = Groq(api_key=api_key) if api_key else None

class ChatRequest(BaseModel):
    message: str

class NoteRequest(BaseModel):
    title: str
    content: str

class TaskRequest(BaseModel):
    text: str
    completed: bool = False

# Load MediGuide knowledge base
BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR.parent / "data" / "health_knowledge.json"

with open(DATA_FILE, "r", encoding="utf-8") as file:
    knowledge_base = json.load(file)


knowledge_texts = [
    item["topic"] + " " + item["content"]
    for item in knowledge_base
]


vectorizer = TfidfVectorizer(stop_words="english")
knowledge_vectors = vectorizer.fit_transform(knowledge_texts)


def find_relevant_knowledge(question):
    question_vector = vectorizer.transform([question])

    similarities = cosine_similarity(
        question_vector,
        knowledge_vectors
    ).flatten()

    best_index = similarities.argmax()

    if similarities[best_index] < 0.1:
        return ""

    return knowledge_base[best_index]["content"]


@app.get("/")
def home():
    return {
        "message": "MediGuide AI backend is running!"
    }


@app.post("/chat")
def chat(request: ChatRequest):

    if client is None:
        return {
            "reply": "Groq API key is missing. Please check your .env file."
        }

    try:

        relevant_knowledge = find_relevant_knowledge(
            request.message
        )

        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are MediGuide AI, an educational "
                        "health-information assistant. "

                        "Explain health topics clearly, simply, "
                        "and in a well-organized way. "

                        "FORMAT EVERY RESPONSE USING CLEAN MARKDOWN. "
                        "Start with a clear heading using ##. "
                        "Use ### for smaller sections. "
                        "Use short paragraphs and bullet points "
                        "when appropriate. "

                        "IMPORTANT: Do NOT use Markdown tables. "
                        "Never use vertical bars or separator lines "
                        "to create tables. "

                        "Instead, present comparisons and structured "
                        "information using bullet points. "

                        "Keep responses visually clean and easy to read. "

                        "Do not diagnose conditions or prescribe medicines. "

                        "Encourage users to consult qualified healthcare "
                        "professionals for personal medical concerns. "

                        "Use the following trusted knowledge when relevant:\n\n"
                        + relevant_knowledge
                    ),
                },
                {
                    "role": "user",
                    "content": request.message,
                },
            ],
            temperature=0.3,
            max_tokens=500,
        )

        ai_reply = response.choices[0].message.content

        chat_collection.insert_one(
            {
                "message": request.message,
                "reply": ai_reply,
                "created_at": datetime.now(),
            }
        )

        return {
            "reply": ai_reply
        }

    except Exception as error:

        print("Groq error:", error)

        return {
            "reply": "Sorry, I could not generate a response right now."
        }


@app.get("/history")
def get_history():

    history = list(
        chat_collection.find(
            {},
            {"_id": 0}
        ).sort(
            "created_at",
            -1
        )
    )

    return {
        "history": history
    }
@app.post("/notes")
def add_note(note: NoteRequest):
    notes_collection.insert_one(
        {
            "title": note.title,
            "content": note.content,
            "created_at": datetime.now(),
        }
    )

    return {
        "message": "Note saved successfully"
    }


@app.get("/notes")
def get_notes():
    notes = list(
        notes_collection.find(
            {},
            {"_id": 0}
        ).sort(
            "created_at",
            -1
        )
    )

    return {
        "notes": notes
    }
@app.post("/tasks")
def add_task(task: TaskRequest):
    tasks_collection.insert_one(
        {
            "text": task.text,
            "completed": task.completed,
            "created_at": datetime.now(),
        }
    )
    return {"message": "Task saved successfully"}
@app.get("/tasks")
def get_tasks():
    tasks = list(
        tasks_collection.find(
            {},
            {"_id": 0}
        ).sort(
            "created_at",
            -1
        )
    )

    return {
        "tasks": tasks
    }
@app.put("/tasks/{text}")
def update_task(text: str, task: TaskRequest):
    tasks_collection.update_one(
        {"text": text},
        {"$set": {"completed": task.completed}}
    )

    return {
        "message": "Task updated successfully"
    }
@app.put("/tasks/{text}")
def update_task(text: str, task: TaskRequest):
    tasks_collection.update_one(
        {"text": text},
        {"$set": {"completed": task.completed}}
    )

    return {
        "message": "Task updated successfully"
    }


@app.delete("/notes/{title}")
def delete_note(title: str):
    notes_collection.delete_one(
        {"title": title}
    )

    return {
        "message": "Note deleted successfully"
    }
@app.delete("/tasks/{text}")
def delete_task(text: str):
    tasks_collection.delete_one(
        {"text": text}
    )

    return {
        "message": "Task deleted successfully"
    }