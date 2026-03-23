import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'question_set_questions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('question_set_id')
        .unsigned()
        .references('id')
        .inTable('question_sets')
        .onDelete('CASCADE')
      table
        .integer('question_id')
        .unsigned()
        .references('id')
        .inTable('questions')
        .onDelete('CASCADE')
      table.primary(['question_set_id', 'question_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
