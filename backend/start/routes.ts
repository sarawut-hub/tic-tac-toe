import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const GamesController = () => import('#controllers/games_controller')
const SessionsController = () => import('#controllers/sessions_controller')
const QuestionsController = () => import('#controllers/questions_controller')
const QuestionSetsController = () => import('#controllers/question_sets_controller')

// Landing / App Pages
router.on('/').render('pages/index')
router.on('/app').render('pages/app')

// Session Page
router
  .get('/session/:code', ({ view, params }) => {
    return view.render('pages/session', { code: params.code })
  })
  .use(middleware.auth())

// Auth Routes
router
  .group(() => {
    router.post('/login/employee', [AuthController, 'loginEmployee'])
    router.get('/login/github', [AuthController, 'loginGithub'])
    router.get('/callback/github', [AuthController, 'callbackGithub'])
    router.get('/login/google', [AuthController, 'loginGoogle'])
    router.get('/callback/google', [AuthController, 'callbackGoogle'])
    router.post('/logout', [AuthController, 'logout'])
  })
  .prefix('auth')

// API Routes
router
  .group(() => {
    // User/Game
    router.get('/users/me', [GamesController, 'me'])
    router.post('/game/move', [GamesController, 'makeMove'])
    router.post('/game/result', [GamesController, 'recordResult'])
    router.post('/game/quiz_answer', [GamesController, 'submitQuizAnswer'])
    router.get('/leaderboard', [GamesController, 'leaderboard'])
    router.post('/admin/reset', [GamesController, 'adminReset'])

    // Sessions
    router.post('/sessions', [SessionsController, 'create'])
    router.get('/sessions/history', [SessionsController, 'history'])
    router.get('/sessions/:code', [SessionsController, 'show'])
    router.post('/sessions/:code/join', [SessionsController, 'join'])
    router.get('/sessions/:code/players', [SessionsController, 'players'])
    router.post('/sessions/:code/start', [SessionsController, 'start'])
    router.post('/sessions/:code/end', [SessionsController, 'end'])
    router.put('/sessions/:code/avatar', [SessionsController, 'updateAvatar'])

    // Questions
    router.resource('questions', QuestionsController).apiOnly()
    router.resource('question-sets', QuestionSetsController).apiOnly()
  })
  .prefix('api')
  .use(middleware.auth())
