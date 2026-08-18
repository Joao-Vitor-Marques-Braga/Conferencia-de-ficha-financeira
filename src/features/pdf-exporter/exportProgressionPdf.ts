import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProgressionSummary } from '../../core/types';
import { formatCurrency, formatPercent } from '../../core/utils/formatters';

export const exportProgressionPdfReport = (summary: ProgressionSummary) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const server = summary.server;
  const params = summary.params;

  // Header Colors
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate-900
  const accentBlue: [number, number, number] = [37, 99, 235]; // Blue-600

  // 1. Official Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ESTADO DE GOIÁS — MUNICÍPIO DE RIO VERDE', 14, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(server.orgao || 'FUNDO MUNICIPAL DE SAÚDE / PREFEITURA DE RIO VERDE', 14, 16);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const dataEmissao = new Date().toLocaleDateString('pt-BR');
  doc.text(`Emissão: ${dataEmissao} • Relatório Client-Side de Conferência`, pageWidth - 14, 16, { align: 'right' });

  // Title Banner
  let yPos = 33;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RELATÓRIO DE APURAÇÃO DE DIFERENÇAS DE PROGRESSÃO FUNCIONAL', 14, yPos);

  yPos += 3;
  doc.setLineWidth(0.5);
  doc.setDrawColor(...accentBlue);
  doc.line(14, yPos, pageWidth - 14, yPos);

  // 2. Server Metadata Box
  yPos += 5;
  doc.setFillColor(248, 250, 252);
  doc.rect(14, yPos, pageWidth - 28, 28, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, yPos, pageWidth - 28, 28, 'S');

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Row 1 Metadata
  doc.setFont('helvetica', 'bold');
  doc.text('Servidor:', 18, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(server.nome || 'NÃO INFORMADO', 35, yPos + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Matrícula:', 130, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(server.matricula || 'N/A', 148, yPos + 7);

  // Row 2 Metadata
  doc.setFont('helvetica', 'bold');
  doc.text('Cargo:', 18, yPos + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(server.cargo || 'NÃO INFORMADO', 35, yPos + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Admissão:', 130, yPos + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(server.admissao || 'N/A', 148, yPos + 14);

  // Row 3 Parameters
  doc.setFont('helvetica', 'bold');
  doc.text('Parâmetros:', 18, yPos + 21);
  doc.setFont('helvetica', 'normal');
  const paramText = `% Progressão: ${formatPercent(params.percentualProgressao)} | % ATS: ${formatPercent(params.percentualATS)} | % Titul.: ${formatPercent(params.percentualTitulacao)} | Divisor: ${params.divisorJornada}h`;
  doc.text(paramText, 38, yPos + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('Período:', 130, yPos + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(`${params.mesInicial} a ${params.mesFinal} (${summary.competenciasSelecionadas.length} mes[es])`, 146, yPos + 21);

  // 3. Events Table using autoTable
  yPos += 34;

  const tableHead = [
    [
      { content: 'Cód.', styles: { halign: 'center' as const } },
      { content: 'Verba / Evento', styles: { halign: 'left' as const } },
      { content: 'Letra 1 (R$)', styles: { halign: 'right' as const } },
      { content: '%', styles: { halign: 'center' as const } },
      { content: 'Letra 2 (R$)', styles: { halign: 'right' as const } },
      { content: 'Dif./Mês (R$)', styles: { halign: 'right' as const } },
      { content: 'Qtd', styles: { halign: 'center' as const } },
      { content: 'Total Acum. (R$)', styles: { halign: 'right' as const } },
      { content: 'Reflexo 13º (R$)', styles: { halign: 'right' as const } }
    ]
  ];

  const tableData = summary.rows.map((row) => [
    row.codigo,
    row.descricao,
    formatCurrency(row.letra1Valor),
    formatPercent(row.percentualAplicado),
    formatCurrency(row.letra2Valor),
    formatCurrency(row.diferencaUnitaria),
    row.qtdMeses,
    formatCurrency(row.totalDiferenca),
    formatCurrency(row.reflexo13)
  ]);

  // Add Totals Row
  tableData.push([
    'TOTAL',
    'TOTAL DA APURAÇÃO',
    formatCurrency(summary.totalLetra1Mensal),
    '-',
    formatCurrency(summary.totalLetra2Mensal),
    formatCurrency(summary.totalDiferencaMensal),
    summary.competenciasSelecionadas.length.toString(),
    formatCurrency(summary.totalDiferencaAcumulada),
    formatCurrency(summary.totalReflexo13)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: tableHead,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      // Highlight Totals Row
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [226, 232, 240];
      }
    }
  });

  // 4. Executive Summary Box (Totals)
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const summaryBoxWidth = 90;
  const summaryBoxX = pageWidth - 14 - summaryBoxWidth;

  doc.setFillColor(241, 245, 249);
  doc.rect(summaryBoxX, finalY, summaryBoxWidth, 34, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(summaryBoxX, finalY, summaryBoxWidth, 34, 'S');

  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  // Line 1: Diferencas Acumuladas
  doc.setFont('helvetica', 'normal');
  doc.text('Diferença Acumulada no Período:', summaryBoxX + 4, finalY + 7);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(summary.totalDiferencaAcumulada), summaryBoxX + summaryBoxWidth - 4, finalY + 7, { align: 'right' });

  // Line 2: Reflexo 13º
  doc.setFont('helvetica', 'normal');
  doc.text('Reflexo em 13º Salário:', summaryBoxX + 4, finalY + 14);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(summary.totalReflexo13), summaryBoxX + summaryBoxWidth - 4, finalY + 14, { align: 'right' });

  // Line 3: Reflexo Ferias
  doc.setFont('helvetica', 'normal');
  doc.text('Reflexo em Férias + 1/3:', summaryBoxX + 4, finalY + 21);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(summary.totalReflexoFerias), summaryBoxX + summaryBoxWidth - 4, finalY + 21, { align: 'right' });

  // Line 4: TOTAL GERAL DEVIDO
  doc.setLineWidth(0.3);
  doc.setDrawColor(148, 163, 184);
  doc.line(summaryBoxX + 4, finalY + 24, summaryBoxX + summaryBoxWidth - 4, finalY + 24);

  doc.setFontSize(9.5);
  doc.setTextColor(22, 101, 52); // Emerald-800
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL GERAL DEVIDO:', summaryBoxX + 4, finalY + 30);
  doc.text(formatCurrency(summary.grandTotal), summaryBoxX + summaryBoxWidth - 4, finalY + 30, { align: 'right' });

  // 5. Signature Block
  const signatureY = finalY + 45;
  if (signatureY < doc.internal.pageSize.getHeight() - 25) {
    doc.setLineWidth(0.3);
    doc.setDrawColor(148, 163, 184);
    
    // Left signature
    doc.line(20, signatureY, 90, signatureY);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Responsável Técnico / Analista de RH', 55, signatureY + 4, { align: 'center' });
    doc.text('Prefeitura Municipal de Rio Verde', 55, signatureY + 8, { align: 'center' });

    // Right signature
    doc.line(120, signatureY, 190, signatureY);
    doc.text('De acordo / Visto da Chefia', 155, signatureY + 4, { align: 'center' });
    doc.text('Fundo Municipal de Saúde', 155, signatureY + 8, { align: 'center' });
  }

  // Save PDF file
  const fileNameClean = (server.nome || 'Servidor').replace(/\s+/g, '_');
  doc.save(`Relatorio_Progressao_${fileNameClean}_${params.mesInicial.replace('/', '-')}_a_${params.mesFinal.replace('/', '-')}.pdf`);
};
