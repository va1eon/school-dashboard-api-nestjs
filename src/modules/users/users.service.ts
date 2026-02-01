import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common'

import {
	Admin,
	Class,
	Parent,
	Prisma,
	Profile,
	Student,
	Subject,
	Teacher,
	User,
	UserRole,
} from '@/prisma/generated/client'
import type { PaginatedResponse } from '@/common/types'
import { PasswordUtil } from '@/common/utils'

import { PrismaService } from '../prisma/prisma.service'
import {
	ChangePasswordDto,
	QueryUsersDto,
	UpdateProfileDto,
	UpdateUserStatusDto,
	UserResponseDto,
} from './dto'

// Тип для пользователя со связями
type UserWithRelations = User & {
	profile: Profile | null
	student?: (Student & { class?: Partial<Class> | null }) | null
	parent?:
		| (Parent & {
				children: Array<{
					relation: string
					isPrimary: boolean
					student: Student & {
						user?: Partial<User> & { profile?: Partial<Profile> | null }
						class?: Partial<Class> | null
					}
				}>
		  })
		| null
	teacher?:
		| (Teacher & {
				subjects?: Array<{ isMain: boolean; subject: Partial<Subject> }>
				homeClass?: Partial<Class> | null
		  })
		| null
	admin?: Admin | null
}

@Injectable()
export class UsersService {
	private readonly logger = new Logger(UsersService.name)

	constructor(private readonly prismaService: PrismaService) {}

	// Получение текущего пользователя
	async getMe(userId: string): Promise<UserResponseDto> {
		const user = await this.prismaService.user.findUnique({
			where: { id: userId },
			include: {
				profile: true,
				student: { include: { class: true } },
				parent: {
					include: {
						children: {
							include: {
								student: {
									include: {
										user: {
											select: {
												id: true,
												email: true,
												profile: {
													select: { firstName: true, lastName: true, avatar: true },
												},
											},
										},
										class: true,
									},
								},
							},
						},
					},
				},
				teacher: {
					include: { subjects: { include: { subject: true } }, homeClass: true },
				},
				admin: true,
			},
		})

		if (!user) throw new NotFoundException('Пользователь не найден')

		return this.formatUserWithRoleData(user as UserWithRelations)
	}

	// Получения пользователя по ID
	async getUserById(id: string, currentUser: User): Promise<UserResponseDto> {
		if (currentUser.role !== UserRole.ADMIN && id !== currentUser.id) {
			const canAccess = await this.checkAccessRights(currentUser, id)
			if (!canAccess)
				throw new ForbiddenException('Нет доступа к данным пользователя')
		}

		const user = await this.prismaService.user.findUnique({
			where: { id },
			include: {
				profile: true,
				student: { include: { class: true } },
				parent: {
					include: {
						children: {
							include: { student: { include: { user: true, class: true } } },
						},
					},
				},
				teacher: {
					include: { subjects: { include: { subject: true } }, homeClass: true },
				},
				admin: true,
			},
		})

		if (!user) throw new NotFoundException('Пользователь не найден')

		return this.formatUserWithRoleData(user as UserWithRelations)
	}

	// Получение списка пользователей (только админ)
	async getUsers(query: QueryUsersDto): Promise<PaginatedResponse<UserResponseDto>> {
		const { role, status, search, page = 1, limit = 20, sortBy, sortOrder } = query
		const where: Prisma.UserWhereInput = {}

		if (role) where.role = role
		if (status) where.status = status
		if (search) {
			where.OR = [
				{ email: { contains: search, mode: 'insensitive' } },
				{
					profile: {
						OR: [
							{ firstName: { contains: search, mode: 'insensitive' } },
							{ lastName: { contains: search, mode: 'insensitive' } },
						],
					},
				},
			]
		}

		const [users, total] = await Promise.all([
			this.prismaService.user.findMany({
				where,
				include: { profile: true },
				skip: (page - 1) * limit,
				take: limit,
				orderBy: this.buildOrderBy(sortBy, sortOrder),
			}),
			this.prismaService.user.count({ where }),
		])

		const totalPages = Math.ceil(total / limit)

		return {
			data: users.map(user => this.formatUser(user)),
			meta: {
				total,
				page,
				limit,
				totalPages,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
			},
		}
	}

	// Обновление профиля
	async updateProfile(
		userId: string,
		dto: UpdateProfileDto
	): Promise<UserResponseDto> {
		const user = await this.prismaService.user.findUnique({
			where: { id: userId },
			include: { profile: true },
		})

		if (!user) {
			throw new NotFoundException('Пользователь не найден')
		}
		if (!user.profile) {
			throw new BadRequestException('Профиль не найден')
		}

		const updateData: Prisma.ProfileUpdateInput = {
			...dto,
			birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
		}
		Object.keys(updateData).forEach(
			k =>
				updateData[k as keyof typeof updateData] === undefined &&
				delete updateData[k as keyof typeof updateData]
		)

		const updatedUser = await this.prismaService.user.update({
			where: { id: userId },
			data: { profile: { update: updateData } },
			include: { profile: true },
		})

		this.logger.log(`Profile updated for user: ${userId}`)
		return this.formatUser(updatedUser)
	}

	// Смена пароля
	async changePassword(
		userId: string,
		dto: ChangePasswordDto
	): Promise<{ message: string }> {
		const user = await this.prismaService.user.findUnique({ where: { id: userId } })
		if (!user) throw new NotFoundException('Пользователь не найден')

		const isValid = await PasswordUtil.verify(user.password, dto.currentPassword)
		if (!isValid) throw new BadRequestException('Неверный текущий пароль')

		const isSame = await PasswordUtil.verify(user.password, dto.newPassword)
		if (isSame)
			throw new BadRequestException('Новый пароль должен отличаться от текущего')

		const hashed = await PasswordUtil.hash(dto.newPassword)
		await this.prismaService.$transaction([
			this.prismaService.user.update({
				where: { id: userId },
				data: { password: hashed },
			}),
			this.prismaService.refreshToken.deleteMany({ where: { userId } }),
		])

		this.logger.log(`Password changed for user: ${userId}`)
		return { message: 'Пароль успешно изменён. Войдите заново.' }
	}

	// Обновление статуса пользователя (только админ)
	async updateUserStatus(
		userId: string,
		dto: UpdateUserStatusDto,
		adminId: string
	): Promise<UserResponseDto> {
		if (userId === adminId)
			throw new BadRequestException('Нельзя изменить свой статус')

		const user = await this.prismaService.user.findUnique({ where: { id: userId } })
		if (!user) throw new NotFoundException('Пользователь не найден')

		const updatedUser = await this.prismaService.user.update({
			where: { id: userId },
			data: { status: dto.status },
			include: { profile: true },
		})
		await this.prismaService.activityLog.create({
			data: {
				userId: adminId,
				action: 'update_status',
				entity: 'User',
				entityId: userId,
				oldData: { status: user.status },
				newData: { status: dto.status },
			},
		})

		this.logger.log(`User status updated: ${userId} -> ${dto.status} by ${adminId}`)
		return this.formatUser(updatedUser)
	}

	// Удаление пользователя (только админ)
	async deleteUser(userId: string, adminId: string): Promise<{ message: string }> {
		if (userId === adminId)
			throw new BadRequestException('Нельзя удалить свой аккаунт')

		const user = await this.prismaService.user.findUnique({ where: { id: userId } })
		if (!user) throw new NotFoundException('Пользователь не найден')

		await this.prismaService.user.delete({ where: { id: userId } })
		await this.prismaService.activityLog.create({
			data: {
				userId: adminId,
				action: 'delete',
				entity: 'User',
				entityId: userId,
				oldData: { email: user.email, role: user.role },
			},
		})

		this.logger.log(`User deleted: ${userId} by ${adminId}`)
		return { message: 'Пользователь успешно удалён' }
	}

	// Приватные методы

	// Проверка прав доступа
	private async checkAccessRights(
		currentUser: User,
		targetUserId: string
	): Promise<boolean> {
		if (currentUser.role === UserRole.PARENT) {
			const parent = await this.prismaService.parent.findUnique({
				where: { userId: currentUser.id },
				include: { children: { include: { student: true } } },
			})
			if (
				parent &&
				parent.children.some(child => child.student.userId === targetUserId)
			)
				return true
		}
		if (currentUser.role === UserRole.TEACHER) {
			const teacher = await this.prismaService.teacher.findUnique({
				where: { userId: currentUser.id },
				include: { homeClass: { include: { students: true } } },
			})
			if (
				teacher?.homeClass &&
				teacher.homeClass.students.some(s => s.userId === targetUserId)
			)
				return true
		}
		return false
	}

	// Сортировка
	private buildOrderBy(
		sortBy?: string,
		sortOrder: 'asc' | 'desc' = 'desc'
	): Prisma.UserOrderByWithRelationInput {
		if (sortBy === 'name') return { profile: { lastName: sortOrder } }
		const valid = ['createdAt', 'email', 'role', 'status', 'lastLoginAt']
		return sortBy && valid.includes(sortBy)
			? { [sortBy]: sortOrder }
			: { createdAt: sortOrder }
	}

	// Форматирование пользователя
	private formatUser(user: User & { profile: Profile | null }): UserResponseDto {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password: _password, ...rest } = user
		return { ...rest, profile: user.profile || null }
	}

	// Форматирование пользователя с данными о Ролях
	private formatUserWithRoleData(user: UserWithRelations): UserResponseDto {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password: _password, ...rest } = user
		const result: UserResponseDto = { ...rest, profile: user.profile || null }

		if (user.student) {
			result.studentData = {
				id: user.student.id,
				studentId: user.student.studentId || null,
				enrollmentDate: user.student.enrollmentDate,
				class: user.student.class || null,
			}
		}

		if (user.parent) {
			result.parentData = {
				id: user.parent.id,
				occupation: user.parent.occupation || null,
				workplace: user.parent.workplace || null,
				children: user.parent.children?.map(c => ({
					relation: c.relation,
					isPrimary: c.isPrimary,
					student: {
						id: c.student.id,
						studentId: c.student.studentId || null,
						user: c.student.user || undefined,
						class: c.student.class || undefined,
					},
				})),
			}
		}

		if (user.teacher) {
			result.teacherData = {
				id: user.teacher.id,
				employeeId: user.teacher.employeeId || null,
				qualification: user.teacher.qualification || null,
				specialization: user.teacher.specialization || null,
				subjects:
					user.teacher.subjects?.map(s => ({
						isMain: s.isMain,
						subject: s.subject,
					})) || [],
				homeClass: user.teacher.homeClass || null,
			}
		}

		if (user.admin) {
			result.adminData = {
				id: user.admin.id,
				department: user.admin.department || null,
				position: user.admin.position || null,
			}
		}

		return result
	}
}
