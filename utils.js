'use strict'

const fetch = require('node-fetch')
const AbortController = require('abort-controller')

const defaultProps = {
	method: 'GET',
	headers: {}
}

const defaultRetryOptions = {
	attemptsLimit: 5,
	interval: 1000
}

async function request(url, opts, timeout = 30000) {
	const controller = new AbortController()
	const signal = controller.signal

	const options = Object.assign({}, defaultProps, { signal }, opts)
	const requestTimeout = setTimeout(() => {
		controller.abort()
	}, timeout)

	try {
		const response = await fetch(url, options)
		return response
	} finally {
		clearTimeout(requestTimeout)
	}
}

function requestUntilSuccess(url, options, timeout = 30000, retryOptions) {
	const retryOpts = Object.assign({}, defaultRetryOptions, retryOptions)
	return execUntilSuccess(request, this, [url, options, timeout], retryOpts)()
}

function execUntilSuccess(fn, thisCtx, args, options) {
	let attempts = 0

	return async function exec() {
		try {
			return await fn.apply(thisCtx, args)
		} catch (err) {
			if (++attempts > options.attemptsLimit) throw err

			return new Promise((resolve, reject) => {
				setTimeout(async () => {
					try {
						return resolve(await exec())
					} catch (err) {
						return reject(err)
					}
				}, options.interval)
			})
		}
	}
}

module.exports = {
	request,
	requestUntilSuccess
}
