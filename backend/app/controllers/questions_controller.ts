import type { HttpContext } from '@adonisjs/core/http'
import Question from '#models/question'

export default class QuestionsController {
  public async index() {
    return await Question.all()
  }

  public async store({ request, response }: HttpContext) {
    const data = request.only(['questionText', 'imageData', 'options', 'correctAnswerIndex'])
    const question = await Question.create(data)
    return response.created(question)
  }

  public async show({ params, response }: HttpContext) {
    const question = await Question.find(params.id)
    if (!question) return response.notFound()
    return question
  }

  public async update({ params, request, response }: HttpContext) {
    const question = await Question.find(params.id)
    if (!question) return response.notFound()

    const data = request.only(['questionText', 'imageData', 'options', 'correctAnswerIndex'])
    question.merge(data)
    await question.save()
    return question
  }

  public async destroy({ params, response }: HttpContext) {
    const question = await Question.find(params.id)
    if (!question) return response.notFound()

    await question.delete()
    return response.noContent()
  }
}
