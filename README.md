# 🌍 GlobeTrekker

GlobeTrekker is a lightweight, AI-powered travel planning and exploration application built using **React**, **TypeScript**, and **Vite**. It enables users to generate structured, intelligent travel-related content through a clean, fast, and modern user interface.

---

## Project Overview

Travel planning often involves scattered information, multiple sources, and time-consuming research. GlobeTrekker simplifies this process by using AI to transform user input into meaningful, well-structured travel content. The focus of this project is to demonstrate how AI can be integrated directly into a modern frontend application to enhance usability and decision-making without introducing unnecessary architectural complexity.

This project was developed as part of an academic mini project to explore client-side AI integration, modern frontend tooling, and clean UI/UX design.

---

## Key Features

- Built with **React + TypeScript**
- Fast development and optimized bundling using **Vite**
- AI-powered content generation using **Google Gemini API**
- Clean, responsive, and user-friendly interface
- Fully client-side architecture with no server or database
- Single API dependency for simplicity and maintainability

---

## Technology Stack

- React  
- TypeScript  
- Vite  
- Google Gemini API  

---

## Application Architecture

- Frontend-only application  
- No backend services  
- No database integration  
- API calls handled directly from the client using environment variables  
- Modular, component-based project structure  

---
## 📂 Project Structure

src/
├── components/
├── services/
├── data/
├── hooks/
├── styles.css
├── App.tsx
├── index.tsx
public/
├── index.html
vite.config.ts
tsconfig.json
package.json
README.md
---
## 🔑 Environment Variables

Create a ⁠ .env ⁠ file in the project root:

VITE_GEMINI_API_KEY=YOUR_GEMINI_KEY

That’s the ONLY required key.
---

## Getting Started

Clone the repository, install dependencies, and start the development server:

```bash
git clone https://github.com/zaid753/GlobeTrekker.git
cd GlobeTrekker
npm install
npm run dev

---
## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
