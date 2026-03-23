import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const GamesController = () => import('#controllers/games_controller')
const SessionsController = () => import('#controllers/sessions_controller')
const QuestionsController = () => import('#controllers/questions_controller')
const QuestionSetsController = () => import('#controllers/question_sets_controller')

import User from '#models/user'
import GameSessionModel from '#models/game_session'
import SessionPlayer from '#models/session_player'

// Landing / App Pages
router.get('/', async ({ view, auth, response }) => {
  if (await auth.check()) {
    return response.redirect('/app')
  }
  return view.render('pages/index')
})

router.get('/app', async ({ auth, view }) => {
  const user = auth.user!
  const leaderboard = await User.query().orderBy('score', 'desc').limit(20)
  return view.render('pages/app', { user, leaderboard })
}).use(middleware.auth())

// Session Page
router.get('/session/:code', async ({ auth, view, params, response }) => {
  const code = params.code
  const session = await GameSessionModel.findBy('code', code)
  if (!session) {
    return response.notFound('Session not found')
  }
  const players = await SessionPlayer.query().where('sessionId', session.id).preload('user')
  const user = auth.user!
  return view.render('pages/session', { user, session, players, code })
}).use(middleware.auth())

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
