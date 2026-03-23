import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'game_sessions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('code').unique().notNullable()
      table.string('name').nullable()
      table.integer('host_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('status').defaultTo('WAITING')
      table.integer('time_limit_minutes').nullable()
      table.json('question_ids').nullable()
      table
        .integer('question_set_id')
        .unsigned()
        .references('id')
        .inTable('question_sets')
        .onDelete('SET NULL')
      table.timestamp('start_time').nullable()
      table.timestamp('end_time').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
