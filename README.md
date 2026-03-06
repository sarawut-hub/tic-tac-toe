# Tic-Tac-Toe Web Application

This project consists of a React frontend (Vite) and a FastAPI backend with SQLite database.

## Prerequisites

- Node.js (v18+)
- Python (v3.10+)
- GitHub Account (for OAuth App)

## Setup Instructions

### 1. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file based on `.env.example` and fill in your GitHub OAuth credentials:
   - Go to [GitHub Developer Settings](https://github.com/settings/developers) -> OAuth Apps -> New OAuth App.
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:8000/auth/callback/github`
   - Copy Client ID and Client Secret to `.env`.
   
   ```bash
   cp .env.example .env
   # Edit .env file
   ```
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Open `http://localhost:5173` in your browser.
2. Click "Login with GitHub".
3. Once logged in, play Tic-Tac-Toe against the bot.
4. Check the leaderboard to see your score and ranking.

## Features

- **OAuth 2.0**: Secure login via GitHub.
- **Scoring**: Win (+1), Lose (-1), Streak Bonus (+1 every 3 consecutive wins).
- **Leaderboard**: View top players.
