# FMS
Получения данных с ГУ МВД

Предзназначен для работы с **Nodejs**

Установка и проверка работоспособности:
```
npm install
npm run test

import FMSClient from './index.mjs'

const client = new FMSClient()
await client.initialize()

const result = await client.validate(SER, NUM)
```



## Update
Актуализированы тесты и исправлены package и lock файлы

Обновлены функции обработки, запросы теперь обрабатываются через node-fetch, а не deprecated request

## API list
- [validate](#validate)

## validate
Получение информации о паспорте гражданина РФ по списку недействительных паспортов.