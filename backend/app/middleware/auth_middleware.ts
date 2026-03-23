import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import JwtService from '#services/jwt_service'
import User from '#models/user'

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const authHeader = ctx.request.header('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ctx.response.unauthorized({ message: 'Missing or invalid token' })
    }

    const token = authHeader.split(' ')[1]
    const payload = JwtService.verify(token)

    if (!payload || !payload.sub) {
      return ctx.response.unauthorized({ message: 'Invalid token' })
    }

    const user = await User.find(payload.sub)
    if (!user) {
      return ctx.response.unauthorized({ message: 'User not found' })
    }

    // Using cast to avoid read-only error if HttpContext doesn't expect manual assignment
    ;(ctx.auth as any).user = user
    return next()
  }
}
