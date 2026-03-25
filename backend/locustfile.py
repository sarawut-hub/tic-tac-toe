"""
Locust Load Test for Tic-Tac-Toe Backend
Run with: locust -f locustfile.py --host=https://tic-tac-toe-backend-dfaag0ewddd9gvc5.southeastasia-01.azurewebsites.net

Web UI at: http://localhost:8089
"""
from locust import HttpUser, task, between
import random
import json


class TicTacToeUser(HttpUser):
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    token = None
    employee_id = None

    def on_start(self):
        """Each simulated user logs in when they start."""
        self.employee_id = str(random.randint(1000, 9999))
        response = self.client.post(
            "/auth/login/employee",
            json={"employee_id": self.employee_id},
            name="/auth/login/employee"
        )
        if response.status_code == 200:
            self.token = response.json().get("access_token")
        else:
            self.token = None

    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(5)
    def get_me(self):
        """Most common: fetch current user profile."""
        self.client.get("/api/users/me", headers=self.auth_headers(), name="/api/users/me")

    @task(3)
    def make_move(self):
        """Play a game move."""
        self.client.post(
            "/api/game/move",
            json={"position": random.randint(0, 8), "session_code": None},
            headers=self.auth_headers(),
            name="/api/game/move"
        )

    @task(2)
    def get_leaderboard(self):
        """View the leaderboard."""
        self.client.get("/api/leaderboard", headers=self.auth_headers(), name="/api/leaderboard")

    @task(1)
    def health_check(self):
        """Ping the root endpoint."""
        self.client.get("/", name="/")
