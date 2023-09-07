import assert from 'assert'
import crypto from 'crypto'
import { createReadStream } from 'fs'
import { requestUntilSuccess } from './../utils.mjs'
import FMSClient from './../index.mjs'

describe('fms-http-client.js', () => {

	let client

	before(async () => {
		client = new FMSClient()
		await client.initialize()
	})

	it('Should return 200 on captcha download', async () => {
		const response = await requestUntilSuccess(`http://services.fms.gov.ru/services/captcha.jpg`)
		assert.strictEqual(response.status, 200)
	}).timeout(50000)

	it('Should calculate valid sha1 hash of an mp3 file', async (done) => {
		const stream = createReadStream('./__test__/data/hash-test-mp3-sha1.mp3')
		const hash = crypto.createHash('sha1')
		stream.on('data', (d) => {
			hash.update(d)
		})
		stream.on('end', () => {
			const d = hash.digest('hex')
			assert.strictEqual(d.toUpperCase(), '015B3BFA638FA0428A3C3938A0747D18FFFE552A')
			done()
		})
	}).timeout(50000)

	it('Should return true if passport is not invalid', async () => {
		const result = await client.validate(4518, 964694)
		assert.strictEqual(result, true)
	}).timeout(50000)

	it('Should return false if passport is invalid', async () => {
		const result = await client.validate(5803, 656288)
		assert.strictEqual(result, false)
	}).timeout(5000)
})
