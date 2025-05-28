const SerialPort = require('serialport').SerialPort;
const ReadlineParser = require('@serialport/parser-readline').ReadlineParser;
const mysql = require('mysql2/promise');

const port = new SerialPort({ path: 'COM4', baudRate: 115200 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'stock_tracer',
});

port.on('open', () => {
  console.log('[INFO] Porta serial aberta');
});

parser.on('data', async (line) => {
  try {
    const data = JSON.parse(line.trim());
    const uid = data.uid; // Código RFID em string (ex: "AB12CD34EF")
    
    if (data.evento === 'novo_produto') {
      // Novo produto: cadastrar no banco

      // 1) Inserir na etiqueta_rfid
      const [existingRFID] = await pool.execute(
        'SELECT ID_Etiqueta_RFID FROM etiqueta_rfid WHERE Codigo_RFID = ?', [uid]
      );
      if (existingRFID.length > 0) {
        console.log('[INFO] RFID já cadastrado, ignorando novo cadastro.');
        return;
      }

      const insertEtiqueta = await pool.execute(
        'INSERT INTO etiqueta_rfid (Codigo_RFID, Status) VALUES (?, ?)',
        [uid, 'ativo']
      );
      const idEtiqueta = insertEtiqueta[0].insertId;

      // 2) Inserir no remedio
      await pool.execute(
        `INSERT INTO remedio 
          (Nome, Lote, Validade, Fabricante, Quantidade, Unidade, ID_Etiqueta_RFID)
         VALUES (?, '', NULL, '', 1, '', ?)`,
        [data.nome || 'Produto Sem Nome', idEtiqueta]
      );

      console.log(`[INFO] Novo produto cadastrado: UID=${uid}, Nome=${data.nome}`);

    } else if (data.evento === 'produto_atualizado') {
      // Produto existente: atualizar quantidade e registrar leitura
      
      // Buscar o remédio pelo Código RFID
      const [remedioRows] = await pool.execute(
        `SELECT r.ID_Remedio, e.ID_Etiqueta_RFID FROM remedio r
         JOIN etiqueta_rfid e ON r.ID_Etiqueta_RFID = e.ID_Etiqueta_RFID
         WHERE e.Codigo_RFID = ?`,
        [uid]
      );

      if (remedioRows.length === 0) {
        console.warn('[WARN] Código RFID não encontrado para atualização:', uid);
        return;
      }

      const idRemedio = remedioRows[0].ID_Remedio;
      const idEtiqueta = remedioRows[0].ID_Etiqueta_RFID;
      const novaQuantidade = data.quantidade || 1;

      // Atualizar quantidade do remédio
      await pool.execute(
        'UPDATE remedio SET Quantidade = ? WHERE ID_Remedio = ?',
        [novaQuantidade, idRemedio]
      );

      // Registrar leitura na leitura_rfid (precisa do ID_Caixa, pode vir no data.caixa)
      const idCaixa = data.caixa || null;
      if (idCaixa) {
        await pool.execute(
          `INSERT INTO leitura_rfid (Data_Hora, ID_Etiqueta_RFID, ID_Caixa)
           VALUES (NOW(), ?, ?)`,
          [idEtiqueta, idCaixa]
        );
      }

      console.log(`[INFO] Quantidade atualizada para ${novaQuantidade} no remédio ID ${idRemedio}`);

    } else {
      console.log('[INFO] Evento desconhecido recebido:', data.evento);
    }

  } catch (error) {
    console.error('[ERRO] Falha ao processar dados:', error.message);
  }
});
