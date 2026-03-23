import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthController {
  /**
   * Login using employee ID (for admins or specific users)
   */
  public async loginEmployee({ request, response, auth, session }: HttpContext) {
    const { employee_id: employeeId } = request.only(['employee_id'])

    if (!employeeId) {
      session.flash('error', 'Employee ID is required')
      return response.redirect('back')
    }

    // In the original app, it seems it just finds or creates a user with this username
    let user = await User.findBy('username', employeeId)

    if (!user) {
      user = await User.create({
        username: employeeId,
        isAdmin: employeeId === 'admin', // Basic logic from original app
      })
    }

    await auth.use('web').login(user)

    return response.redirect('/app')
  }

  /**
   * Logout (session based)
   */
  public async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/')
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
