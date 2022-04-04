'use strict'

const request = require('requestretry')
const crypto = require('crypto')
const fs = require('fs')

const rq = request.defaults({ proxy: undefined })

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
		'27DA534063028EDD4A3B2B06F22A0C0C3F25DB0B'  //9
	]
}

const COOKIE_REGEXP = /=(.+?);/
const IS_NOT_INVALID = /недействительных не значится/gi
const IS_INVALID = /Не действителен/gi

class FmsClient {
	constructor() {}

	async checkValidPassport(ser, num) {
		const cookies = await this._getRequestCookies()
		const parsedCookies = this._parseCookies(cookies)
		const captcha = await this._getCaptcha(parsedCookies)
		return await this._isPassportValidByFms(ser, num, captcha, parsedCookies.sessionId)
	}

	async _getRequestCookies() {
		return new Promise((resolve, reject) => {
			const options = {
				url: 'http://services.fms.gov.ru/services/captcha.jpg'
			}

			rq(options, function(err, response, body) {
				if(err) return reject(err)

				if(!response.headers['set-cookie'] || response.headers['set-cookie'].length === 0)
					return reject(new Error(`Получен неверный ответ от сервера: ${response.headers}`))

				resolve(response.headers['set-cookie'])
			})
		})
	}

	_parseCookies(cookies) {
		const matchResult = cookies.join('').match(COOKIE_REGEXP)
		const obj = {
			arr: [],
			sessionId: matchResult[1]
		}

		for(let p = 1; p < 7; p++) {
			obj.arr.push(config.domainName + config.mp3Path +  matchResult[1] + '/' + p + '.mp3?paramforproxy=todownloadmp3')
		}

		return obj
	}

	async _getCaptcha(parsed) {
		var hashList = []
		for (const url of parsed.arr) {
			const num = await this._getHashNumber(url, parsed.sessionId)
			hashList.push(num)
		}
		return hashList.join('')
	}

	async _getHashNumber(url, sessionId) {
		return new Promise((resolve, reject) => {
			let hash = crypto.createHash('sha1')
			hash.setEncoding('hex')
			const stream = rq({
				url: url,
				method: 'GET',
				headers: {
					'Cookie': 'JSESSIONID=' + sessionId
				},
				maxAttempts: 5,
				retryDelay: 5000
			})
			stream.on('error', (err)  => {
				return reject(err)
			})
			stream.on('data', (d)  => {
				hash.update(d)
			})
			stream.on('end', () => {
				hash = hash.digest('hex')
				for(let j = 0; j < config.sha1Array.length; j++) {
					if(config.sha1Array[j] == hash.toUpperCase()){
						return resolve(j+1)
					}
				}
			})
		})
	}

	async _isPassportValidByFms(ser, num, captcha, sessionId) {
		return new Promise((resolve, reject) => {

			if(captcha.length !== 6) {
				reject(new Error(`Сгенерированна недействительная captcha: ${captcha}`))
			}

			const formData  = {
				sid: 2000,
				form_name: 'form',
				DOC_SERIE: ser,
				DOC_NUMBER: num,
				'captcha-input': captcha
			}

			const opts = {
				url:  config.domainName + config.resultPostpathName,
				method: 'POST',
				headers: {
					Cookie: 'JSESSIONID=' + sessionId
				},
				form: formData,
				followAllRedirects: true,
				maxAttempts: 5,
				retryDelay: 5000
			}

			rq(opts, function (error, response, body) {
				const parseRequestedResult = function(body, serial, number) {
					if (IS_NOT_INVALID.test(body)) return true
					if (IS_INVALID.test(body)) return false
					return new Error(`Невозможно обработать запрос, возможно переданны неверные данные. Серия: ${serial}, номер: ${number}`)
				}

				const result = parseRequestedResult(body, ser, num)
				if (result instanceof Error) return reject(result)
				resolve(result)

			}).on('error', function(error) {
				reject(new Error(`Получен неправильный ответ от fms.gov.ru: ${error}`))
			})
		})
	}
}

module.exports = FmsClient
