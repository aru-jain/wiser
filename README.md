<div align="center">
WISER
<br/>

```

### 🎓 Where Students Connect, Learn & Grow Together

[![Node.js](https://img.shields.io/badge/Node.js-18.x_LTS-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![WebRTC](https://img.shields.io/badge/WebRTC-Native-333333?style=flat-square&logo=webrtc&logoColor=white)](https://webrtc.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

<br/>

</div>

---

## ✨ What is WISER?

**WISER** is a real-time educational social platform built for students. It's a place where learners can share knowledge through posts, engage in discussions via comments and likes, connect through private messages, and collaborate in a shared group space — all powered by a modern Node.js + TypeScript backend.

> 💡 Think of it as a student community hub — part social feed, part classroom chat room, part study group.

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| 📸 **Posts & Feed** | Share educational content, notes, and resources with captions |
| ❤️ **Likes & Comments** | Engage with peers' posts in real time |
| 📖 **Stories** | Share short-lived updates that disappear after 24 hours |
| 💬 **Private Messaging** | One-on-one DMs between students |
| 👥 **Group Chat** | A shared common group where all students can interact |
| 📎 **File Sharing** | Attach images, audio notes, and documents in chat |
| 📞 **Voice Calls** | Peer-to-peer voice calling between online students |
| 🎥 **Video Calls** | Face-to-face video sessions for study and collaboration |
| 🟢 **Live Presence** | See who's online in real time |
| 🔐 **Secure Auth** | JWT-based registration and login system |

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                    WISER Architecture                    │
├──────────────┬──────────────────────────────────────────┤
│   Frontend   │  Vanilla JS (ES6+) · CSS3 · WebRTC       │
│   Realtime   │  Socket.io 4.x (WebSocket + fallback)    │
│   Backend    │  Node.js 18 LTS · TypeScript 5 · Express │
│   Database   │  MongoDB 6 · Mongoose 8 (ODM)            │
│   Media      │  Multer · MediaRecorder API               │
│   Calling    │  WebRTC + Google STUN (RFC 5389)          │
│   Fonts      │  Lora (serif) + DM Sans via Google Fonts  │
└──────────────┴──────────────────────────────────────────┘
```

<details>
<summary><strong>📋 Full Technology Table</strong></summary>
<br/>

| Category | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js | 18.x LTS | Server-side JavaScript execution environment |
| Language | TypeScript | 5.x | Type-safe server code, improves maintainability |
| HTTP Framework | Express.js | 4.x | REST API routing, static file serving, middleware |
| Real-Time | Socket.io | 4.x | WebSocket abstraction, event-driven messaging |
| Database | MongoDB | 6.x | NoSQL document store for all persistent data |
| ODM | Mongoose | 8.x | Schema definition, validation, query abstraction |
| File Upload | Multer | 1.x | Multipart form parsing and local disk storage |
| Calling | WebRTC | Browser native | Peer-to-peer audio/video streaming |
| NAT Traversal | STUN (Google) | RFC 5389 | Public IP discovery for WebRTC ICE candidates |
| Frontend | Vanilla JS (ES6+) | — | DOM manipulation, socket events, WebRTC client |
| Styling | CSS3 | — | Layouts, animations, call overlay, responsive design |
| Fonts | Google Fonts | — | Lora (serif) + DM Sans (UI) via @import |
| Voice Notes | MediaRecorder API | Browser native | Records microphone input as audio/webm Blob |

</details>

---

## 📁 Project Structure

```
wiser/
│
├── 📂 dist/                   → Compiled JavaScript output
├── 📂 node_modules/           → Project dependencies
│
├── 📂 src/
│   ├── 🟨 server.js           → Compiled entry point
│   └── 🔷 server.ts           → Main server (TypeScript source)
│
├── 📂 uploads/                → Uploaded media files (images, audio, docs)
│
├── 🌐 index.html              → Home feed page
├── 🌐 chat.html               → Global group + private DM chat
├── 🌐 signup.html             → Student registration page
├── 🌐 upload.html             → Post & story upload page
│
├── 🎨 style.css               → Global styles
├── 🎨 chat.css                → Chat page styles
├── 🎨 login.css               → Login page styles
├── 🎨 signup.css              → Signup page styles
│
├── ⚙️  tsconfig.json           → TypeScript configuration
├── 📦 package.json            → Project metadata & scripts
└── 🔒 .gitignore              → Git exclusions
```

---


## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have the following installed:

- ✅ [Node.js](https://nodejs.org/) — v18.x LTS or higher
- ✅ [MongoDB](https://www.mongodb.com/) — v6.x (local installation or [MongoDB Atlas](https://www.mongodb.com/atlas))
- ✅ npm — comes bundled with Node.js

---

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/wiser.git
cd wiser

# 2. Install dependencies
npm install


---

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/wiser

```

---

### Build & Run

```bash
# Compile TypeScript to JavaScript
npm run build

# Start the production server
npm start

# Or run in development mode (with auto-reload)
npm run dev
```

🎉 The app will be live at **`http://localhost:3000`**

---

## 📜 Scripts

| Script | Command | Description |
|---|---|---|
| Build | `npm run build` | Compiles TypeScript source to `dist/` |
| Start | `npm start` | Starts the compiled production server |
| Dev | `npm run dev` | Runs server with live-reload for development |

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve WISER:

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-feature-name`
3. Commit your changes — `git commit -m "feat: add your feature"`
4. Push to your branch — `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow the existing code style and write clear commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ for students, by students.

**WISER** — *Learn together. Grow together.*

</div>
