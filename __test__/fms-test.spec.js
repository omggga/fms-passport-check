'use strict'

const assert = require('assert')
const request = require('requestretry')
const crypto = require('crypto')
const fs = require('fs')

const FMSClient = require('./../fms-http-client')
const client = new FMSClient()

//Set proxy if needed
var rq = request.defaults({ proxy: undefined })

describe('fms-http-client.js', () => {

	it('Should return 200 on captcha download', async () => {
		const options = {
			url: 'http://services.fms.gov.ru/services/captcha.jpg'
		}
		rq(options, (error, response, body) => {
			assert.equal(error, null)
			assert.equal(response.statusCode, 200)
		});
	})

	it('Should calculate valid sha1 hash of an mp3 file', async () => {
		const stream = fs.createReadStream('./__test__/data/hash-test-mp3-sha1.mp3')
		const hash = crypto.createHash('sha1')
		stream.on('data', (d) => {
			hash.update(d)
		})
		stream.on('end', () => {
			const d = hash.digest('hex')
			assert.equal(d.toUpperCase(), '015B3BFA638FA0428A3C3938A0747D18FFFE552A')
		})
	})

	it('Should return true if passport is not invalid', async () => {
		const result = await client.checkValidPassport(4518, 964694)
		assert.equal(result, true)
	})

	it('Should return false if passport is invalid', async () => {
		const result = await client.checkValidPassport(5803, 656288)
		assert.equal(result, false)
	})
})
