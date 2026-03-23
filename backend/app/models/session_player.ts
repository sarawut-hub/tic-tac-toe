import { SessionPlayerSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import GameSession from '#models/game_session'

export default class SessionPlayer extends SessionPlayerSchema {
  @belongsTo(() => GameSession)
  declare session: BelongsTo<typeof GameSession>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
