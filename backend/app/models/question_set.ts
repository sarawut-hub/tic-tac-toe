import { QuestionSetSchema } from '#database/schema'
import { manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Question from '#models/question'

export default class QuestionSet extends QuestionSetSchema {
  @manyToMany(() => Question, {
    pivotTable: 'question_set_questions',
  })
  declare questions: ManyToMany<typeof Question>
}
