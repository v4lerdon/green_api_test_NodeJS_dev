const amqp = require('amqplib');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: 'logs/microservice-m2-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

async function startMicroservice() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const QUEUE_NAME = 'requests';
    const PROCESSED_QUEUE_NAME = 'processed_requests';

    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.assertQueue(PROCESSED_QUEUE_NAME, { durable: true });
  
    // Обработка сообщений
    channel.consume(QUEUE_NAME, (msg) => {
      if (msg !== null) {
        const requestData = JSON.parse(msg.content.toString());
        logger.info('Сообщение получено:', requestData);
        // Обрабатываем сообщение
        requestData.message += ' ОБРАБОТАНО В m2';
        logger.info('Сообщение обработано:', requestData);
        // Отправляем обработанный запрос в очередь
        channel.sendToQueue(PROCESSED_QUEUE_NAME, Buffer.from(JSON.stringify(requestData)));
        channel.ack(msg);
        logger.info('Сообщение отправлено в m1:', requestData);
        }
    });
  
    logger.info(`Микросервис m2 готов к получению сообщений из очереди ${QUEUE_NAME}`);
  } catch (error) {
    logger.error('Ошибка выполнении startMicroservice:', error);
  }
}

startMicroservice();
