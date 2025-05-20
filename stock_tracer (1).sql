-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 21/05/2025 às 01:51
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `stock_tracer`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `caixa_rfid`
--

CREATE TABLE `caixa_rfid` (
  `ID_Caixa` int(11) NOT NULL,
  `Localizacao` varchar(255) DEFAULT NULL,
  `Status` varchar(20) DEFAULT NULL,
  `Capacidade_Maxima` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `etiqueta_rfid`
--

CREATE TABLE `etiqueta_rfid` (
  `ID_Etiqueta_RFID` int(11) NOT NULL,
  `Codigo_RFID` varchar(100) DEFAULT NULL,
  `Status` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `leitura_rfid`
--

CREATE TABLE `leitura_rfid` (
  `ID_Leitura` int(11) NOT NULL,
  `Data_Hora` datetime DEFAULT NULL,
  `ID_Etiqueta_RFID` int(11) DEFAULT NULL,
  `ID_Caixa` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `movimentacao_estoque`
--

CREATE TABLE `movimentacao_estoque` (
  `ID_Movimentacao` int(11) NOT NULL,
  `ID_Remedio` int(11) DEFAULT NULL,
  `ID_Usuario` int(11) DEFAULT NULL,
  `Tipo` varchar(45) DEFAULT NULL,
  `Data_Hora` datetime DEFAULT NULL,
  `Quantidade` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `remedio`
--

CREATE TABLE `remedio` (
  `ID_Remedio` int(11) NOT NULL,
  `Nome` varchar(255) DEFAULT NULL,
  `Lote` varchar(50) DEFAULT NULL,
  `Validade` date DEFAULT NULL,
  `Fabricante` varchar(255) DEFAULT NULL,
  `Quantidade` int(11) DEFAULT NULL,
  `Unidade` varchar(50) DEFAULT NULL,
  `ID_Etiqueta_RFID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario`
--

CREATE TABLE `usuario` (
  `ID_Usuario` int(11) NOT NULL,
  `Nome` varchar(255) DEFAULT NULL,
  `Cargo` varchar(45) DEFAULT NULL,
  `Login` varchar(100) DEFAULT NULL,
  `Senha` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuario`
--

INSERT INTO `usuario` (`ID_Usuario`, `Nome`, `Cargo`, `Login`, `Senha`) VALUES
(1, 'Carlos Silva', 'Administrador', 'carlos.silva', 'admin123');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `caixa_rfid`
--
ALTER TABLE `caixa_rfid`
  ADD PRIMARY KEY (`ID_Caixa`);

--
-- Índices de tabela `etiqueta_rfid`
--
ALTER TABLE `etiqueta_rfid`
  ADD PRIMARY KEY (`ID_Etiqueta_RFID`),
  ADD UNIQUE KEY `Codigo_RFID` (`Codigo_RFID`);

--
-- Índices de tabela `leitura_rfid`
--
ALTER TABLE `leitura_rfid`
  ADD PRIMARY KEY (`ID_Leitura`),
  ADD KEY `ID_Etiqueta_RFID` (`ID_Etiqueta_RFID`),
  ADD KEY `ID_Caixa` (`ID_Caixa`);

--
-- Índices de tabela `movimentacao_estoque`
--
ALTER TABLE `movimentacao_estoque`
  ADD PRIMARY KEY (`ID_Movimentacao`),
  ADD KEY `ID_Remedio` (`ID_Remedio`),
  ADD KEY `ID_Usuario` (`ID_Usuario`);

--
-- Índices de tabela `remedio`
--
ALTER TABLE `remedio`
  ADD PRIMARY KEY (`ID_Remedio`),
  ADD UNIQUE KEY `ID_Etiqueta_RFID` (`ID_Etiqueta_RFID`);

--
-- Índices de tabela `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`ID_Usuario`),
  ADD UNIQUE KEY `Login` (`Login`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `caixa_rfid`
--
ALTER TABLE `caixa_rfid`
  MODIFY `ID_Caixa` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `etiqueta_rfid`
--
ALTER TABLE `etiqueta_rfid`
  MODIFY `ID_Etiqueta_RFID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `leitura_rfid`
--
ALTER TABLE `leitura_rfid`
  MODIFY `ID_Leitura` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `movimentacao_estoque`
--
ALTER TABLE `movimentacao_estoque`
  MODIFY `ID_Movimentacao` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `remedio`
--
ALTER TABLE `remedio`
  MODIFY `ID_Remedio` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuario`
--
ALTER TABLE `usuario`
  MODIFY `ID_Usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `leitura_rfid`
--
ALTER TABLE `leitura_rfid`
  ADD CONSTRAINT `leitura_rfid_ibfk_1` FOREIGN KEY (`ID_Etiqueta_RFID`) REFERENCES `etiqueta_rfid` (`ID_Etiqueta_RFID`),
  ADD CONSTRAINT `leitura_rfid_ibfk_2` FOREIGN KEY (`ID_Caixa`) REFERENCES `caixa_rfid` (`ID_Caixa`);

--
-- Restrições para tabelas `movimentacao_estoque`
--
ALTER TABLE `movimentacao_estoque`
  ADD CONSTRAINT `movimentacao_estoque_ibfk_1` FOREIGN KEY (`ID_Remedio`) REFERENCES `remedio` (`ID_Remedio`),
  ADD CONSTRAINT `movimentacao_estoque_ibfk_2` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`);

--
-- Restrições para tabelas `remedio`
--
ALTER TABLE `remedio`
  ADD CONSTRAINT `remedio_ibfk_1` FOREIGN KEY (`ID_Etiqueta_RFID`) REFERENCES `etiqueta_rfid` (`ID_Etiqueta_RFID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
