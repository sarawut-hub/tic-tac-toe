import { QuestionSchema } from '#database/schema'
import { manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import QuestionSet from '#models/question_set'

export default class Question extends QuestionSchema {
  @manyToMany(() => QuestionSet, {
    pivotTable: 'question_set_questions',
  })
  declare questionSets: ManyToMany<typeof QuestionSet>
}
