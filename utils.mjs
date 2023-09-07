import fetch from 'node-fetch'

const defaultProps = {
	method: 'GET',
	headers: {}
}

const defaultRetryOptions = {
	attemptsLimit: 5,
	interval: 1000
}

async function request(url, opts = {}, timeout = 30000) {
	const controller = new AbortController()
	const { signal } = controller

	const options = { ...defaultProps, ...opts, signal }
	const requestTimeout = setTimeout(() => {
		controller.abort()
	}, timeout)

	try {
		return await fetch(url, options)
	} finally {
		clearTimeout(requestTimeout)
	}
}

function requestUntilSuccess(url, options = {}, timeout = 30000, retryOptions = {}) {
	const retryOpts = { ...defaultRetryOptions, ...retryOptions }
	return execUntilSuccess(() => request(url, options, timeout), retryOpts)
}

async function execUntilSuccess(fn, options) {
	let attempts = 0

	const exec = async () => {
		try {
			return await fn()
		} catch (err) {
			if (++attempts > options.attemptsLimit) throw err

			await new Promise(resolve => setTimeout(resolve, options.interval))
			return exec()
		}
	}

	return exec()
}

export {
	requestUntilSuccess
}
