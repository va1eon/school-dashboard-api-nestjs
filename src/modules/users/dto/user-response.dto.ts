import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import {
	Class,
	Gender,
	Profile,
	Subject,
	User,
	UserRole,
	UserStatus,
} from '@/prisma/generated/client'

export class StudentDataDto {
	@ApiProperty()
	id!: string

	@ApiPropertyOptional()
	studentId?: string | null

	@ApiProperty()
	enrollmentDate!: Date

	@ApiPropertyOptional()
	// TODO:
	class?: Partial<Class> | null
}

export class ChildDataDto {
	@ApiProperty()
	relation!: string

	@ApiProperty()
	isPrimary!: boolean

	@ApiProperty()
	student!: Partial<User> & { profile?: Partial<Profile> | null }
}

export class ParentDataDto {
	@ApiProperty()
	id!: string

	@ApiPropertyOptional()
	occupation?: string | null

	@ApiPropertyOptional()
	workplace?: string | null

	@ApiPropertyOptional({ type: [ChildDataDto] })
	children: ChildDataDto[] = []
}

export class SubjectDataDto {
	@ApiProperty()
	isMain!: boolean

	@ApiProperty()
	subject!: Partial<Subject>
}

export class TeacherDataDto {
	@ApiProperty()
	id!: string

	@ApiPropertyOptional()
	employeeId?: string | null

	@ApiPropertyOptional()
	qualification?: string | null

	@ApiPropertyOptional()
	specialization?: string | null

	@ApiPropertyOptional({ type: [SubjectDataDto] })
	subjects?: SubjectDataDto[]

	@ApiPropertyOptional()
	homeClass?: Partial<Class> | null
}

export class AdminDataDto {
	@ApiProperty()
	id!: string

	@ApiPropertyOptional()
	department?: string | null

	@ApiPropertyOptional()
	position?: string | null
}

export class ProfileResponseDto {
	@ApiProperty()
	id!: string

	@ApiProperty()
	firstName!: string

	@ApiProperty()
	lastName!: string

	@ApiPropertyOptional()
	middleName?: string | null

	@ApiPropertyOptional()
	phone?: string | null

	@ApiPropertyOptional()
	avatar?: string | null

	@ApiPropertyOptional({ type: 'string', format: 'date-time' })
	birthDate?: Date | null

	@ApiPropertyOptional({ enum: Gender })
	gender?: Gender | null

	@ApiPropertyOptional()
	address?: string | null

	@ApiPropertyOptional()
	bio?: string | null
}

export class UserResponseDto {
	@ApiProperty()
	id!: string

	@ApiProperty()
	email!: string

	@ApiProperty({ enum: UserRole })
	role!: UserRole

	@ApiProperty({ enum: UserStatus })
	status!: UserStatus

	@ApiProperty()
	emailVerified!: boolean

	@ApiPropertyOptional({ type: 'string', format: 'date-time' })
	lastLoginAt?: Date | null

	@ApiProperty()
	createdAt!: Date

	@ApiProperty()
	updatedAt!: Date

	@ApiPropertyOptional({ type: ProfileResponseDto })
	profile?: ProfileResponseDto | null

	@ApiPropertyOptional({ type: StudentDataDto })
	studentData?: StudentDataDto | null

	@ApiPropertyOptional({ type: ParentDataDto })
	parentData?: ParentDataDto | null

	@ApiPropertyOptional({ type: TeacherDataDto })
	teacherData?: TeacherDataDto | null

	@ApiPropertyOptional({ type: AdminDataDto })
	adminData?: AdminDataDto | null
}
