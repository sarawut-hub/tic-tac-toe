import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Question from '#models/question'
import GameSession from '#models/game_session'
import SessionPlayer from '#models/session_player'
import GameLogicService from '#services/game_logic_service'
import WebsocketService from '#services/websocket_service'

export default class GamesController {
  /**
   * Get current user info
   */
  public async me({ auth }: HttpContext) {
    return auth.user
  }

  /**
   * Make a move in the game
   */
  public async makeMove({ request, auth, response }: HttpContext) {
    const user = auth.user!
    const { position, sessionCode } = request.only(['position', 'sessionCode'])

    let targetObj: any = user
    let session: GameSession | null = null

    if (sessionCode) {
      session = await GameSession.findBy('code', sessionCode)
      if (!session) return response.notFound({ message: 'Session not found' })

      const player = await SessionPlayer.query()
        .where('sessionId', session.id)
        .where('userId', user.id)
        .first()

      if (!player) return response.notFound({ message: 'Player not in session' })
      targetObj = player
    }

    let gameState = targetObj.activeGameState || {
      board: Array(9).fill(null),
      isGameOver: false,
      winner: null,
    }

    if (gameState.isGameOver || (position !== undefined && gameState.board[position] !== null)) {
      return { user, state: gameState }
    }

    // Player move (X)
    if (position !== undefined) {
      gameState.board[position] = 'X'
    }

    let winner = GameLogicService.calculateWinner(gameState.board)

    if (winner) {
      gameState.isGameOver = true
      gameState.winner = winner
    } else {
      // Bot move (O)
      const botMove = GameLogicService.makeBotMove(
        gameState.board,
        (user.botDifficulty as number) || 1
      )
      if (botMove !== -1) {
        gameState.board[botMove] = 'O'
        winner = GameLogicService.calculateWinner(gameState.board)
        if (winner) {
          gameState.isGameOver = true
          gameState.winner = winner
        }
      }
    }

    targetObj.activeGameState = gameState
    await targetObj.save()

    let quizQuestion = null
    if (gameState.isGameOver && gameState.winner === 'X') {
      user.currentStreak = (user.currentStreak || 0) + 1
      if (user.currentStreak % 3 === 0) {
        // Trigger quiz
        const questions = await Question.all()
        if (questions.length > 0) {
          quizQuestion = questions[Math.floor(Math.random() * questions.length)]
        }
      }
      await user.save()
    } else if (gameState.isGameOver && gameState.winner === 'O') {
      user.currentStreak = 0
      await user.save()
    }

    return {
      user,
      state: gameState,
      quiz_question: quizQuestion,
    }
  }

  /**
   * Record game result (e.g., when game ends)
   */
  public async recordResult({ request, auth }: HttpContext) {
    const user = auth.user!
    const { winner, sessionCode } = request.only(['winner', 'sessionCode'])

    let targetObj: any = user
    let session: GameSession | null = null

    if (sessionCode) {
      session = await GameSession.findBy('code', sessionCode)
      if (session) {
        const player = await SessionPlayer.query()
          .where('sessionId', session.id)
          .where('userId', user.id)
          .first()
        if (player) {
          targetObj = player
          if (winner === 'X') {
            player.sessionScore = (player.sessionScore || 0) + 10
            await player.save()
            WebsocketService.broadcast(sessionCode, {
              type: 'SCORE_UPDATE',
              data: { user_id: user.id, score: player.sessionScore },
            })
          }
        }
      }
    }

    if (winner === 'X') {
      user.score = (user.score || 0) + 10
    }

    targetObj.activeGameState = null
    await targetObj.save()
    await user.save()

    return user
  }

  /**
   * Submit quiz answer
   */
  public async submitQuizAnswer({ request, auth }: HttpContext) {
    const user = auth.user!
    const { question_id: questionId, answer_index: answerIndex, sessionCode } = request.only([
      'question_id',
      'answer_index',
      'sessionCode',
    ])

    const question = await Question.find(questionId)
    if (!question) {
      return { correct: false, user }
    }

    const isCorrect = question.correctAnswerIndex === answerIndex
    if (isCorrect) {
      const bonus = 20
      user.score = (user.score || 0) + bonus

      if (sessionCode) {
        const session = await GameSession.findBy('code', sessionCode)
        if (session) {
          const player = await SessionPlayer.query()
            .where('sessionId', session.id)
            .where('userId', user.id)
            .first()
          if (player) {
            player.sessionScore = (player.sessionScore || 0) + bonus
            await player.save()
            WebsocketService.broadcast(sessionCode, {
              type: 'SCORE_UPDATE',
              data: { user_id: user.id, score: player.sessionScore },
            })
          }
        }
      }
    }

    await user.save()
    return { correct: isCorrect, user }
  }

  /**
   * Get leaderboard
   */
  public async leaderboard() {
    return await User.query().orderBy('score', 'desc').limit(20)
  }

  /**
   * Reset all scores (Admin only)
   */
  public async adminReset({ auth, response }: HttpContext) {
    const user = auth.user!
    if (!user.isAdmin) {
      return response.forbidden({ message: 'Only admins can reset scores' })
    }

    await User.query().update({ score: 0, currentStreak: 0 })
    return { message: 'All scores reset' }
  }
}
