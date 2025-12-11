# 🌍 GlobeTrekker

GlobeTrekker is a lightweight, interactive React + TypeScript application built using Vite.  
It allows users to explore global data, destinations, and visual elements in a simple, fast, and modern UI.

This project requires only *one API dependency*:

👉 *Google Gemini API* (for generating AI-powered content)
 
There is *no backend*, no database, and no additional external services.

---

## ✨ Features

•⁠  ⁠⚛️ Built with React + TypeScript  
•⁠  ⁠⚡ Lightning-fast development using Vite  
•⁠  ⁠🌎 Clean UI for exploring global content  
•⁠  ⁠🤖 AI-powered generation using *Gemini API*  
•⁠  ⁠💻 100% client-side — no server required  

---

## 🛠️ Technologies Used

•⁠  ⁠*React*  
•⁠  ⁠*TypeScript*  
•⁠  ⁠*Vite*  
•⁠  ⁠*Google Gemini API*

---

## 📂 Project Structure

/src
App.tsx
index.tsx
components/
services/
data/
hooks/
styles.css
public/
vite.config.ts
tsconfig.json
package.json
README.md


---

## 🔑 Environment Variables

Create a ⁠ .env ⁠ file in the project root:

VITE_GEMINI_API_KEY=YOUR_GEMINI_KEY

yaml


That’s the ONLY required key.

---

## 🚀 Getting Started

### 1️⃣ Clone the repository
bash
git clone https://github.com/zaid753/GlobeTrekker.git
cd GlobeTrekker

---
2️⃣ Install dependencies
bash

npm install

---
3️⃣ Start development server
bash

npm run dev
Open the URL shown in the terminal, usually:

👉 http://localhost:5173/

----

🧠 Using the Gemini API
Gemini API is used inside /services to generate AI responses or content.
The app reads your key from:


import.meta.env.VITE_GEMINI_API_KEY
Make sure your .env file is set before running the project.
