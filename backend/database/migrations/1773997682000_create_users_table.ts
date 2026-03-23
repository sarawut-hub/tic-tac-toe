import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('provider_id').unique().nullable()
      table.string('username').unique().notNullable()
      table.string('email').unique().nullable()
      table.integer('score').defaultTo(0)
      table.integer('current_streak').defaultTo(0)
      table.json('answered_questions').nullable()
      table.integer('bot_difficulty').defaultTo(1)
      table.boolean('is_admin').defaultTo(false)
      table.json('active_game_state').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
