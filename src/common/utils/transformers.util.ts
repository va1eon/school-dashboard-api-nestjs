import { Transform } from 'class-transformer'

export function trimString() {
	return Transform(({ value }) =>
		typeof value === 'string' ? value.trim() : undefined
	)
}

export function normalizeEmail() {
	return Transform(({ value }) =>
		typeof value === 'string' ? value.toLowerCase().trim() : undefined
	)
}

export function parseIntNum() {
	return Transform(({ value }) => {
		if (typeof value !== 'string') return undefined

		const parsed = parseInt(value, 10)
		return Number.isNaN(parsed) ? undefined : parsed
	})
}
