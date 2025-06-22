-- Banco de dados: `stock_tracer`
DROP DATABASE IF EXISTS stock_tracer;
CREATE DATABASE stock_tracer;
USE stock_tracer;

-- ================================
-- TABELA: caixa_rfid
-- ================================
CREATE TABLE `caixa_rfid` (
  `ID_Caixa` int(11) NOT NULL AUTO_INCREMENT,
  `Localizacao` varchar(255) DEFAULT NULL,
  `Status` varchar(20) DEFAULT NULL,
  `Capacidade_Maxima` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID_Caixa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================
-- TABELA: etiqueta_rfid
-- ================================
CREATE TABLE `etiqueta_rfid` (
  `ID_Etiqueta_RFID` int(11) NOT NULL AUTO_INCREMENT,
  `Codigo_RFID` varchar(100) DEFAULT NULL,
  `Status` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`ID_Etiqueta_RFID`),
  UNIQUE KEY `Codigo_RFID` (`Codigo_RFID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================
-- TABELA: localizacao
-- ================================
CREATE TABLE `localizacao` (
  `ID_Localizacao` int(11) NOT NULL AUTO_INCREMENT,
  `Nome` varchar(255) DEFAULT NULL,
  `Descricao` text DEFAULT NULL,
  PRIMARY KEY (`ID_Localizacao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dados iniciais de localizacao
INSERT INTO `localizacao` (`Nome`, `Descricao`) VALUES
('Setor A', 'Área de armazenamento identificada como Setor A'),
('Setor B', 'Área de armazenamento identificada como Setor B'),
('Setor C', 'Área de armazenamento identificada como Setor C'),
('Entrada', 'Área onde os medicamentos chegam ao estoque'),
('Estoque Central', 'Área principal de armazenamento dos medicamentos'),
('Saída', 'Área destinada à saída de medicamentos para distribuição');

-- ================================
-- TABELA: remedio
-- ================================
CREATE TABLE `remedio` (
  `ID_Remedio` int(11) NOT NULL AUTO_INCREMENT,
  `Nome` varchar(255) DEFAULT NULL,
  `Lote` varchar(50) DEFAULT NULL,
  `Validade` date DEFAULT NULL,
  `Fabricante` varchar(255) DEFAULT NULL,
  `Quantidade` int(11) DEFAULT NULL,
  `Unidade` varchar(50) DEFAULT NULL,
  `ID_Etiqueta_RFID` int(11) DEFAULT NULL,
  `ID_Localizacao` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID_Remedio`),
  UNIQUE KEY `ID_Etiqueta_RFID` (`ID_Etiqueta_RFID`),
  CONSTRAINT `remedio_ibfk_1` FOREIGN KEY (`ID_Etiqueta_RFID`) REFERENCES `etiqueta_rfid` (`ID_Etiqueta_RFID`),
  CONSTRAINT `fk_remedio_localizacao` FOREIGN KEY (`ID_Localizacao`) REFERENCES `localizacao` (`ID_Localizacao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================
-- TABELA: leitura_rfid
-- ================================
CREATE TABLE `leitura_rfid` (
  `ID_Leitura` int(11) NOT NULL AUTO_INCREMENT,
  `Data_Hora` datetime DEFAULT NULL,
  `ID_Etiqueta_RFID` int(11) DEFAULT NULL,
  `ID_Caixa` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID_Leitura`),
  KEY `ID_Etiqueta_RFID` (`ID_Etiqueta_RFID`),
  KEY `ID_Caixa` (`ID_Caixa`),
  CONSTRAINT `leitura_rfid_ibfk_1` FOREIGN KEY (`ID_Etiqueta_RFID`) REFERENCES `etiqueta_rfid` (`ID_Etiqueta_RFID`),
  CONSTRAINT `leitura_rfid_ibfk_2` FOREIGN KEY (`ID_Caixa`) REFERENCES `caixa_rfid` (`ID_Caixa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================
-- TABELA: usuario
-- ================================
CREATE TABLE `usuario` (
  `ID_Usuario` int(11) NOT NULL AUTO_INCREMENT,
  `Nome` varchar(255) DEFAULT NULL,
  `Cargo` varchar(45) DEFAULT NULL,
  `Login` varchar(100) DEFAULT NULL,
  `Senha` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID_Usuario`),
  UNIQUE KEY `Login` (`Login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Usuário inicial
INSERT INTO `usuario` (`Nome`, `Cargo`, `Login`, `Senha`) VALUES
('Carlos Silva', 'Administrador', 'carlos.silva', 'admin123');

-- ================================
-- TABELA: movimentacao_estoque
-- ================================
CREATE TABLE `movimentacao_estoque` (
  `ID_Movimentacao` int(11) NOT NULL AUTO_INCREMENT,
  `ID_Remedio` int(11) DEFAULT NULL,
  `ID_Usuario` int(11) DEFAULT NULL,
  `Tipo` varchar(45) DEFAULT NULL,
  `Data_Hora` datetime DEFAULT NULL,
  `Quantidade` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID_Movimentacao`),
  KEY `ID_Remedio` (`ID_Remedio`),
  KEY `ID_Usuario` (`ID_Usuario`),
  CONSTRAINT `movimentacao_estoque_ibfk_1` FOREIGN KEY (`ID_Remedio`) REFERENCES `remedio` (`ID_Remedio`),
  CONSTRAINT `movimentacao_estoque_ibfk_2` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
