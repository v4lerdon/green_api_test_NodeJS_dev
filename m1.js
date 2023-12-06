const express = require('express');
const amqp = require('amqplib');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const app = express();
const PORT = 3000;
const REQUEST_QUEUE_NAME = 'requests';
const PROCESSED_QUEUE_NAME = 'processed_requests';

// Настройка логгера
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: 'logs/microservice-m1-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

app.use(express.json());

amqp.connect('amqp://localhost').then((connection) => {
  return connection.createChannel().then((channel) => {
    // Очередь для получения обработанных сообщений
    channel.assertQueue(PROCESSED_QUEUE_NAME, { durable: true });
    channel.consume(PROCESSED_QUEUE_NAME, (msg) => {
      if (msg !== null) {
        const processedData = JSON.parse(msg.content.toString());
        logger.info('Обработанное сообщение:', processedData);

        // Сохранение обработанного сообщения в переменной, чтобы микросервис m1 мог получить результат
        if (requestPromiseResolver) {
          requestPromiseResolver(processedData);
          requestPromiseResolver = null;
        }

        channel.ack(msg);
      }
    });

    // Очередь для отправки запросов на обработку
    channel.assertQueue(REQUEST_QUEUE_NAME, { durable: true });

    // Обещание (Promise) для хранения функции-разрешителя (resolver)
    let requestPromiseResolver;

    app.post('/process', async (req, res) => {
      const requestData = req.body;
      logger.info('Получен POST запрос:', requestData);

      // Отправляем запрос в очередь
      channel.sendToQueue(REQUEST_QUEUE_NAME, Buffer.from(JSON.stringify(requestData)));
      logger.info('Запрос отправлен в обработку:', requestData);

      // Создаем обещание, которое будет разрешено при получении ответа от второго микросервиса
      const resultPromise = new Promise((resolve) => {
        requestPromiseResolver = resolve;
      });

      try {
        // Ждем разрешения обещания
        const processedData = await resultPromise;

        // Отправляем HTTP-ответ с результатом
        res.json({ processedData });
      } catch (error) {
        logger.error('Ошибка при ожидании ответа от второго микросервиса:', error);
        res.status(500).send('Внутренняя ошибка сервера');
      }
    });
  });
});

app.listen(PORT, () => {
  logger.info(`Микросервис m1 запущен по адресу: http://localhost:${PORT}`);
});
