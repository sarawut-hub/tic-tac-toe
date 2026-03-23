import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import JwtService from '#services/jwt_service'

export default class AuthController {
  /**
   * Login using employee ID (for admins or specific users)
   */
  public async loginEmployee({ request, response }: HttpContext) {
    const { employee_id: employeeId } = request.only(['employee_id'])

    if (!employeeId) {
      return response.badRequest({ message: 'Employee ID is required' })
    }

    // In the original app, it seems it just finds or creates a user with this username
    let user = await User.findBy('username', employeeId)

    if (!user) {
      user = await User.create({
        username: employeeId,
        isAdmin: employeeId === 'admin', // Basic logic from original app
      })
    }

    const token = JwtService.generate(user)

    return {
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
    }
  }

  /**
   * Logout (stateless with JWT, but could handle blacklisting if needed)
   */
  public async logout({ response }: HttpContext) {
    return response.ok({ message: 'Logged out successfully' })
  }

  // Placeholder for OAuth - will implement properly if needed or keep as skeleton
  public async loginGithub({ response }: HttpContext) {
    return response.notImplemented({ message: 'GitHub login not implemented yet' })
  }

  public async callbackGithub({ response }: HttpContext) {
    return response.notImplemented({ message: 'GitHub callback not implemented yet' })
  }

  public async loginGoogle({ response }: HttpContext) {
    return response.notImplemented({ message: 'Google login not implemented yet' })
  }

  public async callbackGoogle({ response }: HttpContext) {
    return response.notImplemented({ message: 'Google callback not implemented yet' })
  }
}
