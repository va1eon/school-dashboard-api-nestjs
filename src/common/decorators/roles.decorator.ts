import { SetMetadata } from '@nestjs/common'

import type { UserRole } from '@/prisma/generated/client'

export const ROLES_KEY = 'roles'
export const RolesDecorator = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles)
