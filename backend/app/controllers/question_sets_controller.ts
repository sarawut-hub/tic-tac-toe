import type { HttpContext } from '@adonisjs/core/http'
import QuestionSet from '#models/question_set'

export default class QuestionSetsController {
  public async index() {
    return await QuestionSet.query().preload('questions')
  }

  public async store({ request, response }: HttpContext) {
    const { name, description, question_ids: questionIds } = request.only(['name', 'description', 'question_ids'])
    const questionSet = await QuestionSet.create({ name, description })

    if (questionIds && questionIds.length > 0) {
      await questionSet.related('questions').attach(questionIds)
    }

    return response.created(questionSet)
  }

  public async show({ params, response }: HttpContext) {
    const questionSet = await QuestionSet.query()
      .where('id', params.id)
      .preload('questions')
      .first()
    if (!questionSet) return response.notFound()
    return questionSet
  }

  public async update({ params, request, response }: HttpContext) {
    const questionSet = await QuestionSet.find(params.id)
    if (!questionSet) return response.notFound()

    const { name, description, question_ids: questionIds } = request.only(['name', 'description', 'question_ids'])
    questionSet.merge({ name, description })
    await questionSet.save()

    if (questionIds) {
      await questionSet.related('questions').sync(questionIds)
    }

    return questionSet
  }

  public async destroy({ params, response }: HttpContext) {
    const questionSet = await QuestionSet.find(params.id)
    if (!questionSet) return response.notFound()

    await questionSet.delete()
    return response.noContent()
  }
}
