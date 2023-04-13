# FMS
Data acquisition from the Ministry of Internal Affairs of Russia

Designed to work with **Nodejs**

Installation and verification of performance:

```javascript
npm install
npm run test

import FMSClient from './index.mjs'

const client = new FMSClient()
await client.initialize()

const result = await client.validate(SER, NUM)
```



## Update
Tests have been updated and package and lock files have been corrected.

Processing functions have been updated, requests are now processed via node-fetch instead of deprecated request.

## API list
- [validate](#validate)

## validate
Obtaining information about the passport of a citizen of the Russian Federation from the list of invalid passports.