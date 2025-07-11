import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Relatorio() {
  const [movimentacoes, setMovimentacoes] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/movimentacoes-completas")
      .then((res) => res.json())
      .then((data) => setMovimentacoes(data))
      .catch((err) => console.error("Erro ao carregar movimentações:", err));
  }, []);

  const gerarPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Relatório de Movimentações de Estoque", 14, 20);

    const colunas = [
      "ID",
      "Remédio",
      "Usuário",
      "Tipo",
      "Data e Hora",
      "Quantidade",
      "Localização",
    ];

    const linhas = movimentacoes.map((mov) => [
      mov.ID_Movimentacao,
      mov.NomeRemedio || "N/D",
      mov.NomeUsuario || "N/D",
      mov.Tipo,
      new Date(mov.Data_Hora).toLocaleString(),
      mov.Quantidade,
      mov.Localizacao || "N/D",
    ]);

    autoTable(doc, {
      startY: 30,
      head: [colunas],
      body: linhas,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [48, 102, 190] },
      columnStyles: {
        3: { cellWidth: 25 },
        4: { cellWidth: 35 },
        6: { cellWidth: 30 },
      },
    });

    doc.save("relatorio_movimentacoes.pdf");
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ color: "#3066BE", marginBottom: 20 }}>
        Relatório de Movimentações de Estoque
      </h2>

      <button
        onClick={gerarPDF}
        style={{
          backgroundColor: "#3066BE",
          color: "white",
          border: "none",
          borderRadius: 6,
          padding: "8px 16px",
          cursor: "pointer",
          marginBottom: 30,
          transition: "background-color 0.3s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#507fca")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3066BE")}
      >
        Exportar PDF
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
          gap: 20,
        }}
      >
        {movimentacoes.length === 0 && <p>Carregando movimentações...</p>}
        {movimentacoes.map((mov) => (
          <div
            key={mov.ID_Movimentacao}
            style={{
              borderRadius: 10,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              padding: 20,
              backgroundColor: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              borderLeft:
                mov.Tipo && mov.Tipo.toLowerCase() === "entrada"
                  ? "6px solid green"
                  : "6px solid red",
              transition: "transform 0.2s",
              cursor: "default",
              wordBreak: "break-word",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <strong>ID:</strong> {mov.ID_Movimentacao}
            <strong>Remédio:</strong> {mov.NomeRemedio || "N/D"}
            <strong>Usuário:</strong> {mov.NomeUsuario || "N/D"}
            <strong>Tipo:</strong>{" "}
            <span
              style={{
                color: mov.Tipo && mov.Tipo.toLowerCase() === "entrada" ? "green" : "red",
              }}
            >
              {mov.Tipo}
            </span>
            <strong>Data e Hora:</strong> {new Date(mov.Data_Hora).toLocaleString()}
            <strong>Quantidade:</strong> {mov.Quantidade}
            <strong>Localização:</strong> {mov.Localizacao || "N/D"}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Relatorio;
