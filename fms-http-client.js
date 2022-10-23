'use strict'

const crypto = require('crypto')
const fs = require('fs')
const FormData = require('form-data')
const utils = require('./utils')

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
		debugger
		const cookies = await this.getRequestCookies()
		const { arr, sessionId } = this.parseCookies(cookies)
		this.sessionId = sessionId
		const captcha = await this.readCaptcha(arr)
		this.captcha = captcha
	}

	async validate(ser, num) {
		return await this.isValid(ser, num)
	}

	async getRequestCookies() {
		const response = await utils.requestUntilSuccess(`http://services.fms.gov.ru/services/captcha.jpg`)
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
		let sessionId = matchResult[1]
		const arr = []

		for (let p = 1; p < 7; p++) {
			arr.push(
				config.domainName +
					config.mp3Path +
					matchResult[1] +
					'/' +
					p +
					'.mp3?paramforproxy=todownloadmp3'
			)
		}

		return { arr, sessionId }
	}

	async readCaptcha(arr) {
		var hashList = []
		for (const url of arr) {
			const num = await this.getHashNum(url)
			hashList.push(num)
		}
		return hashList.join('')
	}

	async getHashNum(url) {
		let hash = crypto.createHash('sha1')
		hash.setEncoding('hex')

		const options = {
			headers: {
				Cookie: 'JSESSIONID=' + this.sessionId
			}
		}

		const response = await utils.requestUntilSuccess(url, options)
		const buff = await response.buffer()
		hash.update(buff)
		hash = hash.digest('hex')

		for (let j = 0; j < config.sha1Array.length; j++) {
			if (config.sha1Array[j] === hash.toUpperCase()) {
				return j + 1
			}
		}
	}

	async isValid(ser, num) {
		if (this.captcha.length !== 6) {
			throw new Error(`Сгенерированна недействительная captcha: ${this.captcha}`)
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
				Cookie: 'JSESSIONID=' + this.sessionId
			},
			body: form
		}

		const response = await utils.requestUntilSuccess(`${config.domainName}${config.resultPostpathName}`, options)
		if (!response.ok) {
			throw new Error(`Ошибка! [${response.status}]:${response.statusText}`)
		}

		const text = await response.text()
		if (/недействительных не значится/gi.test(text)) {
			return true
		} else if (/Не действителен/gi.test(text)) {
			return false
		} else {
			throw new Error(
				`Невозможно обработать запрос, возможно переданны неверные данные или сессия капчи закончилась. Серия: ${ser}, номер: ${num}`
			)
		}
	}
}

module.exports = FmsClient
