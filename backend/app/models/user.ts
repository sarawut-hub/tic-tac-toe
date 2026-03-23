import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import SessionPlayer from '#models/session_player'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  @hasMany(() => SessionPlayer)
  declare sessionPlayers: HasMany<typeof SessionPlayer>
}
