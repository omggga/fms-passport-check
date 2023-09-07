import crypto from 'crypto';
import { requestUntilSuccess } from './utils.mjs'

const config = {
	domainName: 'http://services.fms.gov.ru/',
	resultPostpathName: 'info-service.htm',
	mp3Path: 'services/captcha-audio/',
	sha1Array: [
		'015B3BFA638FA0428A3C3938A0747D18FFFE552A', //1
		'5B0FCB15950B5233A831ABAAF7B4AA2696B7BC68', //2
		'7C421ED662962297882E2ADCA3B8BE911680CC3A', //3
		'F95AD78EB4114F9E31AADF61E07C3F3D4EA06D6E', //4
		'B88FDE7A4932C9A2EDDD7A07DA2478B663039068', //5
		'0177E329811B8543B46B12BEDEF970773231A639', //6
		'5299CF9144F4C2C544CB5F158F89FD2FDED3735D', //7
		'BBA5D021F6F9FD1F72FF6C8827A041D4338E25DD', //8
		'27DA534063028EDD4A3B2B06F22A0C0C3F25DB0B' //9
	]
}

const COOKIE_REGEXP = /=(.+?);/
const IS_NOT_INVALID = /недействительных не значится/gi
const IS_INVALID = /Не действителен/gi

class FmsClient {
	constructor() {
		this.captcha = null
		this.sessionId = null
	}

	async initialize() {
		const cookies = await this.getRequestCookies()
		const { arr, sessionId } = this.parseCookies(cookies)
		this.sessionId = sessionId
		this.captcha = await this.readCaptcha(arr)
	}

	validate(ser, num) {
		return this.isValid(ser, num)
	}

	async getRequestCookies() {
		const response = await requestUntilSuccess(`${config.domainName}services/captcha.jpg`)
		if (!response.ok) {
			throw new Error(`Ошибка! [${response.status}]:${response.statusText}`)
		}

		const cookies = response.headers.get('set-cookie')
		if (!cookies || cookies.length === 0) {
			throw new Error(`Получен неверный ответ от сервера: ${cookies}`)
		}

		return cookies
	}

	parseCookies(cookies) {
		const matchResult = cookies.match(COOKIE_REGEXP)
		const sessionId = matchResult[1]
		const arr = []

		for (let p = 1; p < 7; p++) {
			arr.push(`${config.domainName}${config.mp3Path}${sessionId}/${p}.mp3?paramforproxy=todownloadmp3`)
		}

		return { arr, sessionId }
	}

	async readCaptcha(arr) {
		const hashList = await Promise.all(arr.map(this.getHashNum.bind(this)))
		return hashList.join('')
	}

	async getHashNum(url) {
		const hash = crypto.createHash('sha1')
		hash.setEncoding('hex')

		const options = {
			headers: {
				Cookie: `JSESSIONID=${this.sessionId}`
			}
		}

		const response = await requestUntilSuccess(url, options)
		const buff = await response.arrayBuffer()
		hash.update(Buffer.from(buff))
		const hashHex = hash.digest('hex')
		const index = config.sha1Array.findIndex((val) => val === hashHex.toUpperCase())
		if (index < 0) {
			throw new Error(`SHA1 hash "${hashHex}" not found in config.fms.sha1Array`)
		}
		return index + 1
	}

	async isValid(ser, num) {
		if (this.captcha.length !== 6) {
			throw new Error(`Invalid captcha generated: ${this.captcha}`)
		}

		const form = new FormData()
		form.append('sid', 2000)
		form.append('form_name', 'form')
		form.append('DOC_SERIE', ser)
		form.append('DOC_NUMBER', num)
		form.append('captcha-input', this.captcha)

		const options = {
			method: 'POST',
			headers: {
				Cookie: `JSESSIONID=${this.sessionId}`
			},
			body: form
		}

		const response = await requestUntilSuccess(`${config.domainName}${config.resultPostpathName}`, options)
		if (!response.ok) {
			throw new Error(`Ошибка! [${response.status}]:${response.statusText}`)
		}

		const text = await response.text()
		if (IS_NOT_INVALID.test(text)) {
			return true
		} else if (IS_INVALID.test(text)) {
			return false
		} else {
			throw new Error(
				`Unable to process the request, possibly incorrect data was passed or the captcha session has ended. Series: ${ser}, number: ${num}`
			)
		}
	}
}

export default FmsClient
