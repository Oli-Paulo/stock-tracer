const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const mysql = require("mysql2/promise");

const PORT = "COM4"; // ajuste aqui a porta certa
const BAUDRATE = 115200;

async function main() {
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "stock_tracer",
  });
  console.log("✅ Conectado ao banco de dados");

  const port = new SerialPort({ path: PORT, baudRate: BAUDRATE });
  const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

  parser.on("data", async (line) => {
    line = line.trim();
    if (!line) return;

    let data;
    try {
      data = JSON.parse(line);
    } catch (e) {
      console.warn("Linha serial ignorada (não JSON):", line);
      return;
    }

    if (data.evento === "produto_atualizado") {
      const { uid, nome, quantidade } = data;
      try {
        const [etiquetaRows] = await db.execute(
          "SELECT ID_Etiqueta_RFID FROM etiqueta_rfid WHERE Codigo_RFID = ?",
          [uid]
        );

        if (etiquetaRows.length === 0) {
          console.log(`Etiqueta RFID com UID ${uid} não encontrada no banco.`);
          return;
        }

        const idEtiqueta = etiquetaRows[0].ID_Etiqueta_RFID;

        await db.execute(
          "UPDATE remedio SET Quantidade = ? WHERE ID_Etiqueta_RFID = ?",
          [quantidade, idEtiqueta]
        );

        console.log(`Produto atualizado: ${nome} (UID: ${uid}) quantidade: ${quantidade}`);
      } catch (error) {
        console.error("Erro ao atualizar produto:", error.message);
      }
    } else if (data.evento === "novo_produto") {
      const { uid, nome, localizacao } = data;
      try {
        const [etiquetaRows] = await db.execute(
          "SELECT ID_Etiqueta_RFID FROM etiqueta_rfid WHERE Codigo_RFID = ?",
          [uid]
        );

        let idEtiqueta;

        if (etiquetaRows.length === 0) {
          const [resultEtiqueta] = await db.execute(
            "INSERT INTO etiqueta_rfid (Codigo_RFID, Status) VALUES (?, ?)",
            [uid, "ativo"]
          );
          idEtiqueta = resultEtiqueta.insertId;
          console.log(`Etiqueta RFID cadastrada com UID ${uid}`);
        } else {
          idEtiqueta = etiquetaRows[0].ID_Etiqueta_RFID;
          console.log(`Etiqueta RFID já existente UID ${uid}`);
        }

        const [localRows] = await db.execute(
          "SELECT ID_Localizacao FROM localizacao WHERE Nome = ?",
          [localizacao]
        );

        let idLocalizacao = null;
        if (localRows.length > 0) {
          idLocalizacao = localRows[0].ID_Localizacao;
        } else {
          console.log(`Localização '${localizacao}' não encontrada no banco.`);
        }

        const [resultRemedio] = await db.execute(
          `INSERT INTO remedio (Nome, Quantidade, ID_Etiqueta_RFID)
           VALUES (?, ?, ?)`,
          [nome, 1, idEtiqueta]
        );

        console.log(`Novo produto cadastrado: ${nome} (UID: ${uid}) na localização ${localizacao}`);
      } catch (error) {
        console.error("Erro ao cadastrar novo produto:", error.message);
      }
    } else {
      console.log("Evento desconhecido:", data.evento);
    }
  });

  port.on("error", (err) => {
    console.error("Erro na porta serial:", err.message);
  });
}

main().catch((err) => {
  console.error("Erro no script serial.js:", err);
});
