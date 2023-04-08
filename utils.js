import fetch from 'node-fetch'

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

	const options = { ...defaultProps, signal, ...opts }
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
	const retryOpts = { ...defaultRetryOptions, ...retryOptions }
	return execUntilSuccess(request, this, [url, options, timeout], retryOpts)
}

function execUntilSuccess(fn, thisCtx, args, options) {
	let attempts = 0

	const exec = async () => {
		try {
			return await fn.apply(thisCtx, args)
		} catch (err) {
			if (++attempts > options.attemptsLimit) throw err

			return new Promise((resolve, reject) => {
				setTimeout(async () => {
					try {
						resolve(await exec())
					} catch (err) {
						reject(err)
					}
				}, options.interval)
			})
		}
	}

	return exec()
}

export {
	requestUntilSuccess
}
