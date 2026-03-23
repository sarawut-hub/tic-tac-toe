import { GameSessionSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import SessionPlayer from '#models/session_player'
import QuestionSet from '#models/question_set'

export default class GameSession extends GameSessionSchema {
  @belongsTo(() => User, {
    foreignKey: 'hostId',
  })
  declare host: BelongsTo<typeof User>

  @hasMany(() => SessionPlayer)
  declare players: HasMany<typeof SessionPlayer>

  @belongsTo(() => QuestionSet)
  declare questionSet: BelongsTo<typeof QuestionSet>
}
