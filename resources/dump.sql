-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: db
-- 생성 시간: 20-10-08 04:19
-- 서버 버전: 10.5.5-MariaDB-1:10.5.5+maria~focal
-- PHP 버전: 7.4.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 데이터베이스: `siru`
--

create schema siru;
use siru;

-- --------------------------------------------------------

--
-- 테이블 구조 `pingMetrics`
--

CREATE TABLE `pingMetrics` (
  `id` bigint(20) NOT NULL,
  `ping` bigint(20) NOT NULL,
  `shardId` bigint(20) NOT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 테이블 구조 `playedTracks`
--

CREATE TABLE `playedTracks` (
  `trackId` bigint(20) NOT NULL,
  `lavalinkTrack` longtext NOT NULL,
  `playedCount` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 테이블 구조 `nodeInfoMetrics`
--

CREATE TABLE `nodeInfoMetrics` (
  `id` bigint(20) NOT NULL,
  `systemLoad` bigint(20) NOT NULL,
  `lavalinkLoad` bigint(20) NOT NULL,
  `players` bigint(20) NOT NULL,
  `playingPlayers` bigint(20) NOT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


--
-- 덤프된 테이블의 인덱스
--

--
-- 테이블의 인덱스 `pingMetrics`
--
ALTER TABLE `pingMetrics`
  ADD PRIMARY KEY (`id`);

--
-- 테이블의 인덱스 `playedTracks`
--
ALTER TABLE `playedTracks`
  ADD PRIMARY KEY (`trackId`);

--
-- 테이블의 인덱스 `nodeInfoMetrics`
--
ALTER TABLE `nodeInfoMetrics`
  ADD PRIMARY KEY (`id`);
--
-- 덤프된 테이블의 AUTO_INCREMENT
--

--
-- 테이블의 AUTO_INCREMENT `pingMetrics`
--
ALTER TABLE `pingMetrics`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- 테이블의 AUTO_INCREMENT `playedTracks`
--
ALTER TABLE `playedTracks`
  MODIFY `trackId` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- 테이블의 AUTO_INCREMENT `playedTracks`
--
ALTER TABLE `nodeInfoMetrics`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
