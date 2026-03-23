import Alpine from 'alpinejs'
import axios from 'axios'

window.Alpine = Alpine
window.axios = axios

Alpine.data('alert', function () {
    return {
        isVisible: false,
        dismiss() {
            this.isVisible = false
        },
        init() {
            setTimeout(() => {
                this.isVisible = true
            }, 80)
            setTimeout(() => {
                this.dismiss()
            }, 5000)
        },
    }
})

    Alpine.data('gameApp', (initialData) => ({
        user: initialData.user,
        view: initialData.user && initialData.user.activeGameState ? 'game' : 'menu',
        board: initialData.user && initialData.user.activeGameState ? initialData.user.activeGameState.board : Array(9).fill(null),
        leaderboard: initialData.leaderboard,
        sessionCode: '',
        quiz: null,
        loading: false,

        async fetchLeaderboard() {
            const res = await axios.get('/api/leaderboard');
            this.leaderboard = res.data;
        },

        startSinglePlayer() {
            this.view = 'game';
        },

        async makeMove(index) {
            if (this.board[index] || this.loading) return;
            
            this.loading = true;
            try {
                const res = await axios.post('/api/game/move', { position: index });
                this.board = res.data.state.board;
                this.user = res.data.user;
                
                if (res.data.quiz_question) {
                    this.quiz = res.data.quiz_question;
                }

                if (res.data.state.isGameOver) {
                    // Record result after small delay for animation
                    setTimeout(async () => {
                        await axios.post('/api/game/result', { winner: res.data.state.winner });
                        await this.fetchLeaderboard();
                    }, 500);
                }
            } catch (e) {
                console.error(e);
            } finally {
                this.loading = false;
            }
        },

        async submitQuiz(idx) {
            try {
                const res = await axios.post('/api/game/quiz_answer', {
                    question_id: this.quiz.id,
                    answer_index: idx
                });
                
                alert(res.data.correct ? 'Correct! +20 Points' : 'Wrong Answer!');
                this.quiz = null;
                this.user = res.data.user;
                await this.fetchLeaderboard();
            } catch (e) {
                console.error(e);
            }
        },

        resetGame() {
            this.board = Array(9).fill(null);
            // Server-side reset happens on recordResult or makeMove if game was over
        },

        async createSession() {
            // Placeholder for now
            alert('Session creation coming soon!');
        },

        async joinSession() {
            // Placeholder for now
            alert('Joining session ' + this.sessionCode);
        }
    }))

    Alpine.data('multiplayerApp', (initialData) => ({
        code: initialData.code,
        user: initialData.user,
        session: initialData.session,
        players: initialData.players,
        board: Array(9).fill(null),
        quiz: null,
        ws: null,

        async init() {
            this.connectWS();
        },

        connectWS() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            this.ws = new WebSocket(`${protocol}//${window.location.host}/api/ws/${this.code}`);
            
            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.type === 'PLAYER_JOINED') {
                    // We should really push or update, but for now simple page reload or API fetch.
                    axios.get(`/api/sessions/${this.code}/players`).then(res => this.players = res.data);
                } else if (msg.type === 'SESSION_STARTED') {
                    this.session.status = 'ACTIVE';
                    this.session.start_time = msg.data.start_time;
                } else if (msg.type === 'SESSION_ENDED') {
                    this.session.status = 'ENDED';
                } else if (msg.type === 'SCORE_UPDATE') {
                    const p = this.players.find(p => p.user.id === msg.data.user_id);
                    if (p) p.sessionScore = msg.data.score;
                }
            };
        },

        async startSession() {
            await axios.post(`/api/sessions/${this.code}/start`, {});
        },

        async makeMove(index) {
            if (this.board[index] || this.session.status !== 'ACTIVE') return;
            
            try {
                const res = await axios.post('/api/game/move', { 
                    position: index,
                    sessionCode: this.code
                });
                this.board = res.data.state.board;
                
                if (res.data.quiz_question) {
                    this.quiz = res.data.quiz_question;
                }

                if (res.data.state.isGameOver) {
                    setTimeout(async () => {
                        await axios.post('/api/game/result', { 
                            winner: res.data.state.winner,
                            sessionCode: this.code
                        });
                    }, 500);
                }
            } catch (e) {
                console.error(e);
            }
        },

        async submitQuiz(idx) {
            try {
                const res = await axios.post('/api/game/quiz_answer', {
                    question_id: this.quiz.id,
                    answer_index: idx,
                    sessionCode: this.code
                });
                this.quiz = null;
                alert(res.data.correct ? 'Correct! Bonus points added.' : 'Wrong!');
            } catch (e) {
                console.error(e);
            }
        },

        resetGame() {
            this.board = Array(9).fill(null);
        }
    }))

Alpine.start()
