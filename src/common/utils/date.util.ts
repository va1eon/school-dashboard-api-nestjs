import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'

import 'dayjs/locale/ru.js'

dayjs.extend(duration)
dayjs.extend(relativeTime)
dayjs.locale('ru')

export class DateUtil {
	static now(): Date {
		return dayjs().toDate()
	}

	static parseExpiresIn(expiresIn: string): Date {
		const match = expiresIn.match(/^(\d+)([smhd])$/)

		if (!match) {
			return dayjs().add(7, 'day').toDate()
		}

		const value = parseInt(match[1], 10)
		const unit = match[2] as 's' | 'm' | 'h' | 'd'

		const unitMap: Record<string, dayjs.ManipulateType> = {
			s: 'second',
			m: 'minute',
			h: 'hour',
			d: 'day',
		}

		return dayjs().add(value, unitMap[unit]).toDate()
	}

	static isExpired(date: Date): boolean {
		return dayjs(date).isBefore(dayjs())
	}

	static formatRelative(date: Date): string {
		return dayjs(date).fromNow()
	}

	static format(date: Date, template: 'DD.MM.YYYY HH.mm'): string {
		return dayjs(date).format(template)
	}
}
