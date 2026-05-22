import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js'
import type { RegisterInput, LoginInput } from './auth.schema.js'

const SALT_ROUNDS = 12

export const AuthService = {

  async register(input: RegisterInput) {
    // Vérifier unicité email + username
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email:    input.email },
          { username: input.username },
        ],
      },
    })

    if (existing) {
      if (existing.email === input.email) {
        throw Object.assign(new Error('Email déjà utilisé'), { code: 'EMAIL_TAKEN', status: 409 })
      }
      throw Object.assign(new Error('Nom d\'utilisateur déjà pris'), { code: 'USERNAME_TAKEN', status: 409 })
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)

    const user = await prisma.user.create({
      data: {
        email:       input.email,
        username:    input.username,
        displayName: input.displayName,
        passwordHash,
      },
      select: {
        id: true, email: true, username: true, displayName: true, createdAt: true,
      },
    })

    const tokens = AuthService._generateTokens(user.id, user.email)
    return { user, ...tokens }
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    })

    if (!user) {
      throw Object.assign(new Error('Identifiants invalides'), { code: 'INVALID_CREDENTIALS', status: 401 })
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) {
      throw Object.assign(new Error('Identifiants invalides'), { code: 'INVALID_CREDENTIALS', status: 401 })
    }

    const tokens = AuthService._generateTokens(user.id, user.email)
    return {
      user: {
        id: user.id, email: user.email,
        username: user.username, displayName: user.displayName,
      },
      ...tokens,
    }
  },

  async refresh(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken)
      const user = await prisma.user.findUnique({ where: { id: payload.userId } })
      if (!user) throw new Error('User not found')

      return AuthService._generateTokens(user.id, user.email)
    } catch {
      throw Object.assign(new Error('Refresh token invalide'), { code: 'INVALID_TOKEN', status: 401 })
    }
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, username: true,
        displayName: true, avatarUrl: true, createdAt: true,
      },
    })
    if (!user) throw Object.assign(new Error('Utilisateur introuvable'), { code: 'NOT_FOUND', status: 404 })
    return user
  },

  _generateTokens(userId: string, email: string) {
    return {
      accessToken:  signAccessToken({ userId, email }),
      refreshToken: signRefreshToken({ userId, email }),
    }
  },
}
