import jwt from 'jsonwebtoken'
import env from '#start/env'
import type User from '#models/user'

export default class JwtService {
  /**
   * Secret key for signing tokens
   */
  private static readonly secret = env.get('APP_KEY')

  /**
   * Generate a JWT for a user
   */
  public static generate(user: User): string {
    return jwt.sign(
      {
        sub: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      this.secret as unknown as string,
      { expiresIn: '30d' }
    )
  }

  /**
   * Verify and decode a JWT
   */
  public static verify(token: string): any {
    try {
      return jwt.verify(token, this.secret as unknown as string)
    } catch (error) {
      return null
    }
  }
}
