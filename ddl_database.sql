CREATE DATABASE `exam`

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `email` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `profile_image` varchar(500) DEFAULT NULL,
  `balance` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
)

CREATE TABLE `transaction` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `user_id` varchar(200) NOT NULL,
  `nominal` int NOT NULL,
  `type` varchar(50) NOT NULL,
  `description` varchar(500) NOT NULL,
  `created_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `inv` varchar(200) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `transaction_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
)

CREATE TABLE `services` (
  `code` varchar(20) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `icon` varchar(400) NOT NULL,
  `tarif` int NOT NULL
)

CREATE TABLE `banner` (
  `name` varchar(20) DEFAULT NULL,
  `image` varchar(200) NOT NULL,
  `description` text
)