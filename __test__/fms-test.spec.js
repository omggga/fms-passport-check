'use strict'

const assert = require('assert')
const crypto = require('crypto')
const fs = require('fs')
const utils = require('./../utils')

const FMSClient = require('./../fms-http-client')

describe('fms-http-client.js', () => {

	let client

	before(async () => {
		client = new FMSClient()
		await client.initialize()
	})

	it('Should return 200 on captcha download', async () => {
		const response = await utils.requestUntilSuccess(`http://services.fms.gov.ru/services/captcha.jpg`)
		assert.equal(response.status, 200)
	}).timeout(5000)

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
	}).timeout(5000)

	it('Should return true if passport is not invalid', async () => {
		const result = await client.validate(4518, 964694)
		assert.equal(result, true)
	}).timeout(5000)

	it('Should return false if passport is invalid', async () => {
		const result = await client.validate(5803, 656288)
		assert.equal(result, false)
	}).timeout(5000)
})
