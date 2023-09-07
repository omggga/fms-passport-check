# FMS Client

A Node.js client for data acquisition from the Ministry of Internal Affairs of Russia.

## Prerequisites

- **Node.js**

## Installation and Usage

1. Install the necessary dependencies:
```bash
npm install
npm run test
```
2. Use the FMS client in your project:
```javascsript
import FMSClient from './index.mjs'

const client = new FMSClient()
await client.initialize()

const result = await client.validate(SER, NUM)
```



## Updates
- Tests have been updated.
- Corrections made to package and lock files.
- Transitioned to node-fetch for request processing, replacing the deprecated request library.


## API
- [validate](#validate)

## validate
Obtaining information about the passport of a citizen of the Russian Federation from the list of invalid passports.