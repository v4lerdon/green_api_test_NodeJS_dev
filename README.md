# green_api_test_NodeJS_dev
Тестовое задание на должность "Разработчик NodeJS"

В рамках выполнения тестового задания требуется разработать механизм асинхронной обработки

HTTP запросов и опубликовать исходники проекта на Github для дальнейшего анализа и проверки.

Время на выполнения задания: 3 дня.

Требования:
1. Требуется разработать механизм асинхронной обработки HTTP запросов
2. Требуется использовать стек NodeJS, RabbitMQ
3. Требуется оформить в виде репозитория на Github
4. Требуется приложить инструкцию по локальному развертыванию проекта
5. Требуется реализовать логирование для целей отладки и мониторинга
6. Требуется разработать микросервис М1 для обработки входящих HTTP запросов
7. Требуется разработать микросервис М2 для обработки заданий из RabbitMQ

Алгоритм работы:
• Получаем HTTP запрос на уровне микросервиса М1.
• Транслируем HTTP запрос в очередь RabbitMQ. Запрос трансформируется в задание.
• Обрабатываем задание микросервисом М2 из очереди RabbitMQ.
• Помещаем результат обработки задания в RabbitMQ.
• Возвращаем результат HTTP запроса как результат выполнения задания из RabbitMQ.

## Описание проекта:
Проект состоит из двух микросервисов (m1 и m2), они получают и отправляют сообщения из очередей rabbitmq.

Микросервис m1 получает и обрабатывает входящие HHTP POST-запросы, отправляет данные запроса в очередь и ожидает результат от микросервиса m2. После получения ответа, отправляет HTTP ответ.

Микросервис m2 получает сообщения от m1 из очереди requests, обрабатывает их и отправляет в очередь processed_requests.

Библиотека winston используется для ведения логов, они регистрируются как в консоли, так и в ежедневных файлах. Логи ведутся под каждый микросервис отдельно.