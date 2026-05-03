# ⚗️ Story Forge — AI-Powered Creative Writing App

> A full-stack AI creative writing assistant that generates immersive stories word by word in real time, powered by Google Gemini.

![Story Forge](https://img.shields.io/badge/AI-Google%20Gemini-blue?style=for-the-badge&logo=google)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Framework-Express-black?style=for-the-badge&logo=express)
![JavaScript](https://img.shields.io/badge/Frontend-JavaScript-yellow?style=for-the-badge&logo=javascript)

---

## ✨ Features

- 🔴 **Real-time Story Streaming** — Stories appear word by word using Server-Sent Events
- 🧙 **8 Story Genres** — Fantasy, Sci-Fi, Horror, Romance, Mystery, Thriller, Historical, Literary
- 🎭 **AI Character Builder** — Generate rich characters with backstories, personalities and quirks
- 🎯 **AI Story Critique** — Get scored feedback with strengths and improvement suggestions
- ✨ **Prompt Enhancer** — AI makes your prompt more vivid before generating
- 📚 **Story Library** — Save and reload your stories anytime
- 🏷️ **Title Generator** — Get 5 AI-suggested titles for your story
- 📱 **Fully Responsive** — Works on desktop, tablet and mobile

---

## 🖥️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| AI / LLM | Google Gemini API |
| Streaming | Server-Sent Events (SSE) |
| Storage | Browser localStorage |
| Hosting | Render (backend) + GitHub Pages (frontend) |

---

## 🚀 Live Demo

- **Frontend:** https://subradeepM.github.io/story-forge
- **Backend:** https://story-forge.onrender.com

---

## 🛠️ Run Locally

### Prerequisites
- Node.js v18+
- Google Gemini API key (free at https://aistudio.google.com)

### Steps

1. Clone the repository:
```bash
git clone https://github.com/SubradeepM/story-forge.git
cd story-forge
```

2. Install dependencies:
```bash
npm install
```

3. Create your `.env` file:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=*
```

4. Start the backend server:
```bash
npm run dev
```

5. Open `frontend/index.html` with VS Code Live Server

6. Visit `http://127.0.0.1:5500` in your browser

---

## 📁 Project Structure

```
story-forge/
├── backend/
│   └── server.js          # Express server + Gemini API
├── frontend/
│   ├── index.html          # Main HTML
│   ├── css/
│   │   └── style.css       # Dark luxury design
│   └── js/
│       ├── app.js          # Frontend logic
│       └── particles.js    # Ambient animations
├── .env.example
├── package.json
└── render.yaml
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate-story` | Stream a story in real time |
| POST | `/api/generate-character` | Generate an AI character |
| POST | `/api/generate-titles` | Suggest 5 story titles |
| POST | `/api/critique` | Get AI story critique |
| POST | `/api/enhance-prompt` | Enhance writing prompt |
| GET | `/api/health` | Server health check |

---

## 👨‍💻 Author

**Subradeep Majumder**
- GitHub: [@SubradeepM](https://github.com/SubradeepM)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
