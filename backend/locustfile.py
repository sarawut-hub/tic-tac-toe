"""
Locust Load Test for Tic-Tac-Toe Backend — Full API Coverage
==============================================================
Run: locust -f locustfile.py --host=https://tic-tac-toe-backend-dfaag0ewddd9gvc5.southeastasia-01.azurewebsites.net
UI:  http://localhost:8089

User types:
  - RegularUser  : login, play game, view leaderboard/profile  (90% of traffic)
  - AdminUser    : login as admin, manage questions/sessions    (10% of traffic)
"""
from locust import HttpUser, task, between, TaskSet
import random
import json

# -----------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------

def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"} if token else {}


# -----------------------------------------------------------------------
# Regular Player
# -----------------------------------------------------------------------

class RegularUser(HttpUser):
    weight = 9
    wait_time = between(1, 3)

    token = None
    board = None       # None = no active game
    session_code = None
    active_session = False

    # ── Lifecycle ────────────────────────────────────────────────────────

    def on_start(self):
        emp_id = str(random.randint(1000, 9999))
        r = self.client.post(
            "/auth/login/employee",
            json={"employee_id": emp_id},
            name="/auth/login/employee"
        )
        if r.status_code == 200:
            self.token = r.json().get("access_token")
        else:
            self.token = None

    def on_stop(self):
        if self.token:
            self.client.post("/auth/logout", headers=_auth_headers(self.token), name="/auth/logout")

    # ── Auth / profile ──────────────────────────────────────────────────

    @task(3)
    def get_me(self):
        self.client.get("/api/users/me", headers=_auth_headers(self.token), name="/api/users/me")

    @task(1)
    def get_leaderboard(self):
        self.client.get("/api/leaderboard", headers=_auth_headers(self.token), name="/api/leaderboard")

    @task(1)
    def health_check(self):
        self.client.get("/", name="/")

    # ── Solo game ────────────────────────────────────────────────────────

    @task(6)
    def play_game_move(self):
        if not self.token:
            return
        available = [i for i, v in enumerate(self.board or [None]*9) if v is None]
        if not available:
            self.board = None
            return
        position = random.choice(available)
        r = self.client.post(
            "/api/game/move",
            json={"position": position, "session_code": None},
            headers=_auth_headers(self.token),
            name="/api/game/move"
        )
        if r.status_code == 200:
            data = r.json()
            state = data.get("state")
            if state and state.get("board") and not data.get("result"):
                self.board = state["board"]
            else:
                self.board = None   # game over
        else:
            self.board = None

    # ── Session ──────────────────────────────────────────────────────────

    @task(2)
    def browse_session(self):
        """Try to join a known session or just check session history."""
        if not self.token:
            return
        # Fetch personal session history
        self.client.get(
            "/api/sessions/history",
            headers=_auth_headers(self.token),
            name="/api/sessions/history"
        )

    @task(1)
    def get_session_players(self):
        """If we know a session code, list its players."""
        if not self.token or not self.session_code:
            return
        self.client.get(
            f"/api/sessions/{self.session_code}/players",
            headers=_auth_headers(self.token),
            name="/api/sessions/{code}/players"
        )

    @task(1)
    def play_in_session(self):
        """Make a move inside an active session if we have one."""
        if not self.token or not self.session_code or not self.active_session:
            return
        available = [i for i, v in enumerate(self.board or [None]*9) if v is None]
        if not available:
            self.board = None
            return
        position = random.choice(available)
        r = self.client.post(
            "/api/game/move",
            json={"position": position, "session_code": self.session_code},
            headers=_auth_headers(self.token),
            name="/api/game/move (session)"
        )
        if r.status_code == 200:
            data = r.json()
            state = data.get("state")
            if state and state.get("board") and not data.get("result"):
                self.board = state["board"]
            else:
                self.board = None


# -----------------------------------------------------------------------
# Admin User  (create/manage questions, sessions, and question sets)
# -----------------------------------------------------------------------

class AdminUser(HttpUser):
    weight = 1
    wait_time = between(2, 5)

    token = None
    created_session_code = None
    created_question_id = None
    created_set_id = None

    def on_start(self):
        r = self.client.post(
            "/auth/login/employee",
            json={"employee_id": "admin"},
            name="/auth/login/employee [admin]"
        )
        if r.status_code == 200:
            self.token = r.json().get("access_token")
        else:
            self.token = None

    def on_stop(self):
        if self.token:
            self.client.post("/auth/logout", headers=_auth_headers(self.token), name="/auth/logout")

    # ── Questions (admin) ────────────────────────────────────────────────

    @task(3)
    def list_questions(self):
        self.client.get(
            "/api/questions/",
            headers=_auth_headers(self.token),
            name="/api/questions/ [GET]"
        )

    @task(1)
    def create_and_delete_question(self):
        if not self.token:
            return
        # CREATE
        r = self.client.post(
            "/api/questions/",
            json={
                "question_text": f"Load test question {random.randint(1,9999)}?",
                "options": ["A", "B", "C", "D"],
                "correct_answer_index": 0,
                "image_data": None
            },
            headers=_auth_headers(self.token),
            name="/api/questions/ [POST]"
        )
        if r.status_code == 200:
            qid = r.json().get("id")
            if qid:
                # UPDATE
                self.client.put(
                    f"/api/questions/{qid}",
                    json={
                        "question_text": f"Updated question {qid}?",
                        "options": ["A", "B", "C", "D"],
                        "correct_answer_index": 1,
                        "image_data": None
                    },
                    headers=_auth_headers(self.token),
                    name="/api/questions/{id} [PUT]"
                )
                # DELETE
                self.client.delete(
                    f"/api/questions/{qid}",
                    headers=_auth_headers(self.token),
                    name="/api/questions/{id} [DELETE]"
                )

    # ── Question Sets (admin) ─────────────────────────────────────────────

    @task(2)
    def list_question_sets(self):
        self.client.get(
            "/api/question-sets/",
            headers=_auth_headers(self.token),
            name="/api/question-sets/ [GET]"
        )

    @task(1)
    def create_and_delete_question_set(self):
        if not self.token:
            return
        r = self.client.post(
            "/api/question-sets/",
            json={"name": f"Load Test Set {random.randint(1,999)}", "question_ids": []},
            headers=_auth_headers(self.token),
            name="/api/question-sets/ [POST]"
        )
        if r.status_code == 200:
            sid = r.json().get("id")
            if sid:
                self.client.delete(
                    f"/api/question-sets/{sid}",
                    headers=_auth_headers(self.token),
                    name="/api/question-sets/{id} [DELETE]"
                )

    # ── Sessions (admin) ─────────────────────────────────────────────────

    @task(2)
    def create_and_manage_session(self):
        if not self.token:
            return
        # CREATE session
        r = self.client.post(
            "/api/sessions",
            json={"name": f"Test Session {random.randint(1,999)}", "time_limit_minutes": 5, "question_ids": []},
            headers=_auth_headers(self.token),
            name="/api/sessions [POST]"
        )
        if r.status_code == 200:
            code = r.json().get("code")
            if code:
                self.created_session_code = code

                # GET session info
                self.client.get(
                    f"/api/sessions/{code}",
                    headers=_auth_headers(self.token),
                    name="/api/sessions/{code} [GET]"
                )

                # GET players
                self.client.get(
                    f"/api/sessions/{code}/players",
                    headers=_auth_headers(self.token),
                    name="/api/sessions/{code}/players [GET]"
                )

                # START session
                self.client.post(
                    f"/api/sessions/{code}/start",
                    headers=_auth_headers(self.token),
                    name="/api/sessions/{code}/start [POST]"
                )

                # END session
                self.client.post(
                    f"/api/sessions/{code}/end",
                    headers=_auth_headers(self.token),
                    name="/api/sessions/{code}/end [POST]"
                )

    @task(1)
    def view_session_history(self):
        self.client.get(
            "/api/sessions/history",
            headers=_auth_headers(self.token),
            name="/api/sessions/history [admin]"
        )
