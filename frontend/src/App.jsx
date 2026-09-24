import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";
import { useEffect } from "react";

function App() {
  const [page, setPage] = useState("Overview");
  const [history, setHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState("");

  const loadHistory = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/history"
      );

      const data = await response.json();

      setHistory(data.history);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const loadNotes = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/notes"
      );

      const data = await response.json();

      setNotes(data.notes);
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  };

  const openHistoryChat = (item) => {
    setPage("AI Assistant");
    setQuestion(item.message);
    setReply(item.reply);
  };

  useEffect(() => {
  if (page === "History") {
    loadHistory();
  }

  if (page === "Health Notes") {
    loadNotes();
  }

  if (page === "Tasks") {
    loadTasks();
  }
}, [page]);

  const saveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/notes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: noteTitle,
            content: noteContent,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      setNoteTitle("");
      setNoteContent("");

      await loadNotes();
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const deleteNote = async (title) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/notes/${encodeURIComponent(title)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      await loadNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const loadTasks = async () => {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/tasks"
    );

    const data = await response.json();

    setTasks(data.tasks);
  } catch (error) {
    console.error("Error loading tasks:", error);
  }
};

const addTask = async () => {
  if (!taskText.trim()) return;

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/tasks",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: taskText,
          completed: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to save task");
    }

    setTaskText("");
    await loadTasks();
  } catch (error) {
    console.error("Error saving task:", error);
  }
};

  const askAI = async (event) => {
    event.preventDefault();

    if (!question.trim()) return;

    setLoading(true);
    setReply("");

    try {
      const response = await fetch(
        "https://mediguide-ai-wubs.onrender.com/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: [
              ...chatHistory.map(
                (item) => `${item.role}: ${item.content}`
              ),
              `user: ${question}`,
            ].join("\n"),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Backend error");
      }

      const data = await response.json();

      setReply(data.reply);

      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: data.reply },
      ]);

      await loadHistory();
    } catch (error) {
      setReply(
        "Unable to connect to the backend. Please check that FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const openAssistant = (text = "") => {
    setPage("AI Assistant");
    setQuestion(text);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✚</div>

          <div>
            <h2>MediGuide</h2>
            <span>AI HEALTH COMPANION</span>
          </div>
        </div>

        <p className="menu-title">MAIN MENU</p>

        <nav className="navigation">
          <button
            className={page === "Overview" ? "active" : ""}
            onClick={() => setPage("Overview")}
          >
            ◈ Overview
          </button>

          <button
            className={page === "AI Assistant" ? "active" : ""}
            onClick={() => setPage("AI Assistant")}
          >
            ✦ AI Assistant
          </button>

          <button
            className={page === "Health Notes" ? "active" : ""}
            onClick={() => setPage("Health Notes")}
          >
            ▤ Health Notes
          </button>

          <button
            className={page === "Tasks" ? "active" : ""}
            onClick={() => setPage("Tasks")}
          >
            ✓ Tasks
          </button>

          <button
            className={page === "History" ? "active" : ""}
            onClick={() => setPage("History")}
          >
            ◷ Chat History
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="privacy-card">
            <strong>🔒 Privacy first</strong>
            <p>Your information is handled with care.</p>
          </div>

          <small>MediGuide AI v1.0</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR PERSONAL HEALTH SPACE</p>

            <h1>
              Welcome to <span>MediGuide.</span>
            </h1>
          </div>

          <div className="profile">
            <div className="profile-avatar">S</div>

            <div>
              <strong>Student User</strong>
              <small>Learning mode</small>
            </div>
          </div>
        </header>

        {page === "Overview" && (
          <>
            <section className="welcome-card">
              <div className="welcome-text">
                <p className="eyebrow">
                  WELCOME TO MEDIGUIDE AI
                </p>

                <h2>
                  Understand your health.
                  <br />
                  <em>One question at a time.</em>
                </h2>

                <p>
                  Explore reliable educational health information
                  with your intelligent learning companion.
                </p>

                <button
                  className="primary-button"
                  onClick={() => openAssistant()}
                >
                  Start exploring →
                </button>
              </div>

              <div className="welcome-art">
                <div className="orbital-circle">✚</div>
              </div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">✦</span>
                <p>AI ASSISTANT</p>
                <h3>24/7</h3>
                <small>Available for learning</small>
              </div>

              <div className="stat-card">
                <span className="stat-icon">◈</span>
                <p>HEALTH TOPICS</p>
                <h3>100+</h3>
                <small>Topics to explore</small>
              </div>

              <div className="stat-card">
                <span className="stat-icon">🔒</span>
                <p>EXPERIENCE</p>
                <h3>Private</h3>
                <small>Privacy-conscious design</small>
              </div>
            </section>

            <section className="content-grid">
              <div className="panel">
                <p className="eyebrow">QUICK ACCESS</p>

                <h2>What would you like to learn?</h2>

                <div className="suggestions">
                  <button
                    onClick={() =>
                      openAssistant(
                        "What is a balanced diet?"
                      )
                    }
                  >
                    ✦ What is a balanced diet? ↗
                  </button>

                  <button
                    onClick={() =>
                      openAssistant(
                        "Why is sleep important?"
                      )
                    }
                  >
                    ✦ Why is sleep important? ↗
                  </button>

                  <button
                    onClick={() =>
                      openAssistant(
                        "What are the benefits of drinking water?"
                      )
                    }
                  >
                    ✦ Benefits of drinking water ↗
                  </button>
                </div>
              </div>

              <div className="panel activity-panel">
                <p className="eyebrow">
                  YOUR LEARNING SPACE
                </p>

                <h2>Keep exploring</h2>

                <p>
                  Ask questions and build your health-related
                  knowledge with MediGuide AI.
                </p>

                <button
                  className="secondary-button"
                  onClick={() =>
                    setPage("Health Notes")
                  }
                >
                  Explore notes →
                </button>
              </div>
            </section>
          </>
        )}

        {page === "AI Assistant" && (
          <section className="chat-page">
            <p className="eyebrow">
              YOUR INTELLIGENT COMPANION
            </p>

            <h2>AI Health Assistant</h2>

            <p>
              Ask an educational question about health and
              wellness.
            </p>

            <div className="chat-box">
              <div className="message ai-message">
                <strong>MediGuide AI</strong>

                <p>
                  Hello! Ask me a health-related educational
                  question.
                </p>
              </div>

              {reply && (
                <div className="message ai-message">
                  <strong>MediGuide AI</strong>

                  <div className="ai-response">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                    >
                      {reply}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              <form
                className="chat-form"
                onSubmit={askAI}
              >
                <input
                  type="text"
                  placeholder="Ask your question..."
                  value={question}
                  onChange={(event) =>
                    setQuestion(event.target.value)
                  }
                />

                <button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "..." : "Send"}
                </button>
              </form>
            </div>

            <p className="disclaimer">
              Educational information only. This application
              does not provide diagnoses or prescriptions.
            </p>
          </section>
        )}

        {page === "Health Notes" && (
          <section className="placeholder-page">
            <p className="eyebrow">
              YOUR PERSONAL SPACE
            </p>

            <h2>Health Notes</h2>

            <p>
              Save important health information you learn.
            </p>

            <div className="notes-box">
              <input
                type="text"
                placeholder="Note title..."
                value={noteTitle}
                onChange={(event) =>
                  setNoteTitle(event.target.value)
                }
              />

              <textarea
                placeholder="Write your health note here..."
                rows="6"
                value={noteContent}
                onChange={(event) =>
                  setNoteContent(event.target.value)
                }
              ></textarea>

              <button
                className="primary-button"
                onClick={saveNote}
              >
                Save Note
              </button>
            </div>

            <div className="notes-list">
              {notes.map((note, index) => (
                <div
                  className="history-card"
                  key={index}
                >
                  <h3>{note.title}</h3>

                  <p>{note.content}</p>

                  <button
                    className="secondary-button"
                    onClick={() =>
                      deleteNote(note.title)
                    }
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {page === "Tasks" && (
          <section className="placeholder-page">
            <p className="eyebrow">
              STAY ORGANIZED
            </p>

            <h2>Health Tasks</h2>

            <p>
              Keep track of your health-learning tasks.
            </p>

            <div className="notes-box">
              <input
                type="text"
                placeholder="Add a task..."
                value={taskText}
                onChange={(event) =>
                  setTaskText(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addTask();
                  }
                }}
              />

              <button
                className="primary-button"
                onClick={addTask}
              >
                Add Task
              </button>
            </div>

            <div className="notes-list">
              {tasks.length === 0 ? (
                <p>
                  No tasks yet. Add your first task above.
                </p>
              ) : (
                tasks.map((task, index) => (
                  <div
                    className="history-card"
                    key={index}
                  >
                    <div>
                      <h3
                        style={{
                          textDecoration:
                            task.completed
                              ? "line-through"
                              : "none",
                        }}
                      >
                        {task.text}
                      </h3>
                    </div>

                    <button
                      className="secondary-button"
                      onClick={async () => {
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/tasks/${encodeURIComponent(task.text)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: task.text,
          completed: !task.completed,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    await loadTasks();
  } catch (error) {
    console.error("Error updating task:", error);
  }
}}
                    >
                      {task.completed
                        ? "Undo"
                        : "Complete"}
                    </button>

                    <button
                      className="secondary-button"
                      onClick={async () => {
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/tasks/${encodeURIComponent(task.text)}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete task");
    }

    await loadTasks();
  } catch (error) {
    console.error("Error deleting task:", error);
  }
}}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {page === "History" && (
          <section className="placeholder-page">
            <p className="eyebrow">
              YOUR CONVERSATIONS
            </p>

            <h2>Chat History</h2>

            <p>
              Your previous MediGuide conversations.
            </p>

            <div className="history-list">
              {history.length === 0 ? (
                <p>No conversations yet.</p>
              ) : (
                history.map((item, index) => (
                  <div
                    className="history-card"
                    key={index}
                    onClick={() =>
                      openHistoryChat(item)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <p className="history-question">
                      <strong>You:</strong>{" "}
                      {item.message}
                    </p>

                    <div className="history-answer">
                      <strong>MediGuide AI:</strong>

                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                      >
                        {item.reply}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        <footer>
          <strong>MEDIGUIDE AI</strong>

          <p>
            Built for learning • Privacy-conscious •
            Educational use only
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;