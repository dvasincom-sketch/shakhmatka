import type { Access, PayloadRequest } from 'payload'

/** Роли: admin — всё, включая пользователей; editor — правит досье и загружает фото. Пользователь без роли — admin (созданные до ролей). */
export type Role = 'admin' | 'editor'
type U = { role?: Role | null } | null | undefined
export const roleOf = (u: U): Role | null => (u ? (u.role || 'admin') : null)
export const isStaff = (u: U) => !!roleOf(u)
export const isAdmin = (u: U) => roleOf(u) === 'admin'

export const staff: Access = ({ req }: { req: PayloadRequest }) => isStaff(req.user as U)
export const admins: Access = ({ req }: { req: PayloadRequest }) => isAdmin(req.user as U)
