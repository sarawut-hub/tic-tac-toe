import type { HttpContext } from '@adonisjs/core/http'
import SessionPlayer from '#models/session_player'
import GameSessionModel from '#models/game_session'
import QuestionSet from '#models/question_set'
import WebsocketService from '#services/websocket_service'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'

export default class SessionsController {
  private generateCode(): string {
    return crypto.randomBytes(3).toString('hex').toUpperCase()
  }

  /**
   * Create a new session
   */
  public async create({ request, auth, response }: HttpContext) {
    const user = auth.user!
    if (!user.isAdmin) {
      return response.forbidden({ message: 'Only admins can create sessions' })
    }

    const { name, time_limit_minutes: timeLimitMinutes, question_set_id: questionSetId, question_ids: questionIds } = request.only([
      'name',
      'time_limit_minutes',
      'question_set_id',
      'question_ids',
    ])

    let code = this.generateCode()
    while (await GameSessionModel.findBy('code', code)) {
      code = this.generateCode()
    }

    let finalQuestionIds = questionIds || []
    if (questionSetId && finalQuestionIds.length === 0) {
      const qSet = await QuestionSet.query().where('id', questionSetId).preload('questions').first()
      if (qSet) {
        finalQuestionIds = qSet.questions.map((q) => q.id)
      }
    }

    const session = await GameSessionModel.create({
      code,
      name,
      hostId: user.id,
      timeLimitMinutes: timeLimitMinutes,
      questionIds: finalQuestionIds,
      questionSetId: questionSetId,
      status: 'WAITING',
    })

    return session
  }

  /**
   * Get session history for host
   */
  public async history({ auth }: HttpContext) {
    const user = auth.user!
    const sessions = await GameSessionModel.query()
      .where('hostId', user.id)
      .orderBy('createdAt', 'desc')

    const now = DateTime.now()
    for (const session of sessions) {
      if (session.status === 'ACTIVE' && session.endTime && now > session.endTime) {
        session.status = 'ENDED'
        await session.save()
      }
    }

    return sessions
  }

  /**
   * Get session details
   */
  public async show({ params, response }: HttpContext) {
    const session = await GameSessionModel.findBy('code', params.code)
    if (!session) {
      return response.notFound({ message: 'Session not found' })
    }

    if (session.status === 'ACTIVE' && session.endTime && DateTime.now() > session.endTime) {
      session.status = 'ENDED'
      await session.save()
    }

    return session
  }

  /**
   * Join a session
   */
  public async join({ params, auth, response }: HttpContext) {
    const session = await GameSessionModel.findBy('code', params.code)
    if (!session) {
      return response.notFound({ message: 'Session not found' })
    }

    const user = auth.user!

    let player = await SessionPlayer.query()
      .where('sessionId', session.id)
      .where('userId', user.id)
      .first()

    if (player) {
      return player
    }

    if (session.status !== 'WAITING') {
      return response.badRequest({ message: 'Cannot join active or ended session' })
    }

    // Reset user stats for new session
    user.currentStreak = 0
    user.botDifficulty = 1
    await user.save()

    player = await SessionPlayer.create({
      sessionId: session.id,
      userId: user.id,
      sessionScore: 0,
    })

    WebsocketService.broadcast(session.code, {
      type: 'PLAYER_JOINED',
      data: { username: user.username, id: user.id },
    })

    return player
  }

  /**
   * Get players in session
   */
  public async players({ params, response }: HttpContext) {
    const session = await GameSessionModel.findBy('code', params.code)
    if (!session) {
      return response.notFound({ message: 'Session not found' })
    }

    return await SessionPlayer.query().where('sessionId', session.id).preload('user')
  }

  /**
   * Start session
   */
  public async start({ params, auth, response }: HttpContext) {
    const session = await GameSessionModel.findBy('code', params.code)
    if (!session) {
      return response.notFound({ message: 'Session not found' })
    }

    if (session.hostId !== auth.user!.id) {
      return response.forbidden({ message: 'Only host can start session' })
    }

    if (session.status !== 'WAITING') {
      return response.badRequest({ message: 'Session already started or ended' })
    }

    session.status = 'ACTIVE'
    session.startTime = DateTime.now()
    if (session.timeLimitMinutes) {
      session.endTime = session.startTime.plus({ minutes: session.timeLimitMinutes })
    }

    await session.save()

    WebsocketService.broadcast(session.code, {
      type: 'SESSION_STARTED',
      data: {
        status: 'ACTIVE',
        start_time: session.startTime.toISO(),
        end_time: session.endTime?.toISO(),
      },
    })

    return session
  }

  /**
   * End session
   */
  public async end({ params, auth, response }: HttpContext) {
    const session = await GameSessionModel.findBy('code', params.code)
    if (!session) {
      return response.notFound({ message: 'Session not found' })
    }

    if (session.hostId !== auth.user!.id) {
      return response.forbidden({ message: 'Only host can end session' })
    }

    session.status = 'ENDED'
    session.endTime = DateTime.now()
    await session.save()

    WebsocketService.broadcast(session.code, {
      type: 'SESSION_ENDED',
      data: { status: 'ENDED' },
    })

    return { message: 'Session ended' }
  }

  /**
   * Update player avatar
   */
  public async updateAvatar({ params, request, auth, response }: HttpContext) {
    const session = await GameSessionModel.findBy('code', params.code)
    if (!session) {
      return response.notFound({ message: 'Session not found' })
    }

    const player = await SessionPlayer.query()
      .where('sessionId', session.id)
      .where('userId', auth.user!.id)
      .first()

    if (!player) {
      return response.notFound({ message: 'Player not found in this session' })
    }

    const { avatar_config: avatarConfig } = request.only(['avatar_config'])
    player.avatarConfig = avatarConfig
    await player.save()

    WebsocketService.broadcast(session.code, {
      type: 'AVATAR_UPDATE',
      data: { user_id: auth.user!.id, avatar_config: avatarConfig },
    })

    return player
  }
}
