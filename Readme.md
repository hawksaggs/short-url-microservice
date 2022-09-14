
# Project Title

A Simple URL Shortener using microservice architecture


## Tech Stack

Nodejs + MySQL + RabbitMQ + Redis + Docker
## Documentation

The application will consist of 2 services
- Management Service
- Redirection Service

RabbitMQ/Kafka will be used for transferring messages between services

![App Screenshot](https://miro.medium.com/max/558/1*-yciqX1QVbJV9twnVYjfHQ.png)

### Management Service

Management service has a API for creating and deleting URLs.

It should use MySQL/PostgresSQL for persisting the data.

After creation of data, it must send to RabbitMQ/Kafka

### Redirection Service

Redirection service will find the real url, based on hash part of short url.

User will be redirected to real url.

Redirection accepts information about short url through RabbitMQ/Kafka.

In the case of creating the short url, the data will be stored in Redis.

In the case of deleting the short url, the data will be deleted from Redis.

#### Rate limiter

Implement rate limiting on Redirection Service where the service allows 10 redirect requests in a period of 120 seconds for a specific URL.