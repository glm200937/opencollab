import { z } from 'zod'

export const RegisterSchema = z.object({
  email:       z.string().email('Email invalide'),
  username:    z.string().min(3, 'Minimum 3 caractères').max(30).regex(
    /^[a-z0-9_-]+$/,
    'Uniquement lettres minuscules, chiffres, _ et -',
  ),
  displayName: z.string().min(1).max(60),
  password:    z.string().min(8, 'Minimum 8 caractères'),
})

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput    = z.infer<typeof LoginSchema>
export type RefreshInput  = z.infer<typeof RefreshSchema>
