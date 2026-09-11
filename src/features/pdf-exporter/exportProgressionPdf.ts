import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProgressionSummary } from '../../core/types';
import type { ConsolidationSummaryData, InstallmentOverrideMap } from '../calculation/domain/types';
import { calculateConsolidation } from '../calculation/domain/usecases/calculateConsolidation';
import { formatCurrency, formatPercent } from '../../core/utils/formatters';
import { RIO_VERDE_LOGO_BASE64 } from './rioVerdeLogoBase64';

export const exportProgressionPdfReport = (
  summary: ProgressionSummary,
  installmentOverrides: InstallmentOverrideMap = {}
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const server = summary.server;
  const params = summary.params;

  // Compute Consolidation Data for the PDF
  const consolidation: ConsolidationSummaryData = calculateConsolidation(
    summary,
    params.diasRetroativos ?? 30,
    installmentOverrides
  );

  // Official Rio Verde Brand Colors (RGB)
  const colorGreen: [number, number, number] = [0, 141, 80];    // #008d50
  const colorNavy: [number, number, number] = [50, 79, 114];    // #324f72
  const colorOrange: [number, number, number] = [223, 104, 36]; // #df6824
  const colorYellow: [number, number, number] = [234, 208, 77]; // #ead04d

  // 1. Official Top Color Stripe (4 quadrants)
  const stripeWidth = pageWidth / 4;
  doc.setFillColor(...colorGreen);
  doc.rect(0, 0, stripeWidth, 3, 'F');
  doc.setFillColor(...colorNavy);
  doc.rect(stripeWidth, 0, stripeWidth, 3, 'F');
  doc.setFillColor(...colorOrange);
  doc.rect(stripeWidth * 2, 0, stripeWidth, 3, 'F');
  doc.setFillColor(...colorYellow);
  doc.rect(stripeWidth * 3, 0, stripeWidth, 3, 'F');

  // Main Header Background (Navy #324f72)
  doc.setFillColor(...colorNavy);
  doc.rect(0, 3, pageWidth, 24, 'F');

  // Official Rio Verde Emblem/Logo (rendered directly with native transparency)
  doc.addImage(RIO_VERDE_LOGO_BASE64, 'PNG', 12, 5.5, 19, 19);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('PREFEITURA MUNICIPAL DE RIO VERDE — GOIÁS', 35.5, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(server.orgao || 'FUNDO MUNICIPAL DE SAÚDE / ADMINISTRAÇÃO DIRETA', 35.5, 16.5);
  doc.text('DEMONSTRATIVO DE DIFERENÇAS DE PROGRESSÃO FUNCIONAL & PARCELAMENTO', 35.5, 21.5);

  doc.setFontSize(7.5);
  doc.setTextColor(234, 208, 77); // Yellow highlight
  const now = new Date();
  const dataHoraEmissao = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  doc.text(`Emissão: ${dataHoraEmissao}`, pageWidth - 14, 16.5, { align: 'right' });
  doc.setTextColor(255, 255, 255);

  // 2. Server Metadata Box
  let yPos = 31;
  doc.setFillColor(245, 248, 250);
  doc.rect(14, yPos, pageWidth - 28, 26, 'F');
  doc.setLineWidth(0.3);
  doc.setDrawColor(...colorNavy);
  doc.rect(14, yPos, pageWidth - 28, 26, 'S');

  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  // Row 1 Metadata
  doc.setFont('helvetica', 'bold');
  doc.text('Servidor(a):', 18, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(server.nome || 'NÃO INFORMADO', 38, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Matrícula:', 130, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(server.matricula || 'N/A', 148, yPos + 6);

  // Row 2 Metadata
  doc.setFont('helvetica', 'bold');
  doc.text('Cargo:', 18, yPos + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(server.cargo || 'NÃO INFORMADO', 38, yPos + 13);

  doc.setFont('helvetica', 'bold');
  doc.text(params.portariaNumero ? 'Ato/Portaria:' : 'Admissão:', 130, yPos + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(params.portariaNumero || server.portariaNumero || server.admissao || 'N/A', 148, yPos + 13);

  // Row 3 Parameters & Period
  doc.setFont('helvetica', 'bold');
  doc.text('Parâmetros:', 18, yPos + 20);
  doc.setFont('helvetica', 'normal');
  const letraEvolucao = params.letraOrigem && params.letraDestino ? `Letra ${params.letraOrigem} -> Letra ${params.letraDestino} | ` : '';
  const paramText = `${letraEvolucao}% Prog.: ${formatPercent(params.percentualProgressao)}`;
  doc.text(paramText, 38, yPos + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Período:', 130, yPos + 20);
  doc.setFont('helvetica', 'normal');
  const periodRateioText = params.modoRateio === 'DATA_EFETIVA' && params.dataEfetiva
    ? `${params.mesInicial} a ${params.mesFinal} (Efet.: ${params.dataEfetiva})`
    : `${params.mesInicial} a ${params.mesFinal} (${consolidation.diasRetroativos} dias ret.)`;
  doc.text(periodRateioText, 144, yPos + 20);

  // 3. Section Title 1: Tabela Analítica
  yPos += 30;
  doc.setTextColor(...colorNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  const secTitle = params.letraOrigem && params.letraDestino
    ? `1. APURAÇÃO ANALÍTICA DE DIFERENÇAS SALARIAIS (LETRA ${params.letraOrigem} → LETRA ${params.letraDestino})`
    : '1. APURAÇÃO ANALÍTICA DE DIFERENÇAS SALARIAIS (LETRA 1 → LETRA 2)';
  doc.text(secTitle, 14, yPos);

  yPos += 2;
  const tableHead = [
    [
      { content: 'Cód.', styles: { halign: 'center' as const } },
      { content: 'Verba / Evento', styles: { halign: 'left' as const } },
      { content: params.letraOrigem ? `Letra ${params.letraOrigem} (R$)` : 'Letra 1 (R$)', styles: { halign: 'right' as const } },
      { content: '%', styles: { halign: 'center' as const } },
      { content: params.letraDestino ? `Letra ${params.letraDestino} (R$)` : 'Letra 2 (R$)', styles: { halign: 'right' as const } },
      { content: 'Dif./Mês (R$)', styles: { halign: 'right' as const } },
      { content: 'Qtd. Meses', styles: { halign: 'center' as const } },
      { content: 'Total Acum. (R$)', styles: { halign: 'right' as const } },
      { content: 'Reflexo 13º (R$)', styles: { halign: 'right' as const } }
    ]
  ];

  const tableData: (string | { content: string; styles?: any })[][] = [];

  summary.rows.forEach((row) => {
    if (row.isUnified && row.subItens && row.subItens.length > 0) {
      // No laudo PDF oficial para o servidor, desmembra a unificação para exibir diretamente os eventos e códigos originais
      row.subItens.forEach((sub) => {
        tableData.push([
          sub.codigo,
          sub.descricao,
          formatCurrency(sub.letra1Valor),
          formatPercent(sub.percentualAplicado),
          formatCurrency(sub.letra2Valor),
          formatCurrency(sub.diferencaUnitaria),
          sub.qtdMeses.toString().replace('.', ','),
          formatCurrency(sub.totalDiferenca),
          formatCurrency(sub.reflexo13)
        ]);
      });
    } else {
      tableData.push([
        row.codigo,
        row.descricao,
        formatCurrency(row.letra1Valor),
        formatPercent(row.percentualAplicado),
        formatCurrency(row.letra2Valor),
        formatCurrency(row.diferencaUnitaria),
        row.qtdMeses.toString().replace('.', ','),
        formatCurrency(row.totalDiferenca),
        formatCurrency(row.reflexo13)
      ]);
    }
  });

  // Add Totals Row
  tableData.push([
    'TOTAL',
    'TOTAL DA APURAÇÃO ANALÍTICA',
    formatCurrency(summary.totalLetra1Mensal),
    '-',
    formatCurrency(summary.totalLetra2Mensal),
    formatCurrency(summary.totalDiferencaMensal),
    summary.qtdMesesEquivalentes.toString().replace('.', ','),
    formatCurrency(summary.totalDiferencaAcumulada),
    formatCurrency(summary.totalReflexo13)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: tableHead,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: colorNavy,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 1.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 1.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [225, 235, 245];
        data.cell.styles.textColor = colorNavy;
      }
    }
  });

  // 4. Section Title 2: Consolidação Final e Parcelamento
  let currentY = (doc as any).lastAutoTable.finalY + 6;

  doc.setTextColor(...colorNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('2. QUADRO DE CONSOLIDAÇÃO FINAL & PARCELAMENTO', 14, currentY);

  currentY += 2;

  const textDark: [number, number, number] = [15, 23, 42];
  const textWhite: [number, number, number] = [255, 255, 255];

  // Consolidation Table Headers
  const consolHead = [
    [
      { content: 'TOTAL (INTEGRAL)', colSpan: 4, styles: { halign: 'center' as const, fillColor: colorOrange, textColor: textDark } },
      { content: `PROPORCIONAL (${consolidation.diasRetroativos} DIAS)`, colSpan: 2, styles: { halign: 'center' as const, fillColor: colorYellow, textColor: textDark } },
      { content: 'TOTAL GERAL', colSpan: 2, styles: { halign: 'center' as const, fillColor: colorNavy, textColor: textWhite } },
    ],
    [
      { content: 'EVENTOS', styles: { halign: 'left' as const } },
      { content: 'VALOR TOTAL', styles: { halign: 'right' as const } },
      { content: 'PARC.', styles: { halign: 'center' as const } },
      { content: 'VALOR PARCELA', styles: { halign: 'right' as const } },
      { content: 'VALOR TOTAL', styles: { halign: 'right' as const } },
      { content: 'VALOR PARCELA', styles: { halign: 'right' as const } },
      { content: 'TOTAL GERAL', styles: { halign: 'right' as const } },
      { content: 'TOTAL PARCELADO', styles: { halign: 'right' as const } }
    ]
  ];

  const unifiedRowMap = new Map<string, typeof summary.rows[0]>();
  summary.rows.forEach(r => {
    if (r.isUnified && r.subItens && r.subItens.length > 0) {
      unifiedRowMap.set(r.codigo, r);
    }
  });

  const consolBody: (string | { content: string; styles?: any })[][] = [];

  consolidation.items
    .filter((item) => item.valorTotalIntegral > 0 || item.valorTotalProporcional > 0 || item.totalGeral > 0)
    .forEach((item) => {
      const unifiedRow = unifiedRowMap.get(item.id) || (item.codigo ? unifiedRowMap.get(item.codigo) : undefined);
      if (unifiedRow && unifiedRow.subItens && unifiedRow.subItens.length > 0) {
        const totalDif = unifiedRow.totalDiferenca || 1;
        unifiedRow.subItens.forEach((sub) => {
          const ratio = totalDif > 0 ? (sub.totalDiferenca / totalDif) : (1 / unifiedRow.subItens!.length);
          const subIntegral = item.valorTotalIntegral * ratio;
          const subParcelaIntegral = item.valorParcelaIntegral * ratio;
          const subProporcional = item.valorTotalProporcional * ratio;
          const subParcelaProporcional = item.valorParcelaProporcional * ratio;
          const subTotalGeral = item.totalGeral * ratio;
          const subTotalGeralParcelado = item.totalGeralParcelado * ratio;

          consolBody.push([
            sub.descricao,
            formatCurrency(subIntegral),
            item.parcelas.toString(),
            formatCurrency(subParcelaIntegral),
            formatCurrency(subProporcional),
            formatCurrency(subParcelaProporcional),
            formatCurrency(subTotalGeral),
            formatCurrency(subTotalGeralParcelado)
          ]);
        });
      } else {
        consolBody.push([
          item.descricao,
          formatCurrency(item.valorTotalIntegral),
          item.parcelas.toString(),
          formatCurrency(item.valorParcelaIntegral),
          formatCurrency(item.valorTotalProporcional),
          formatCurrency(item.valorParcelaProporcional),
          formatCurrency(item.totalGeral),
          formatCurrency(item.totalGeralParcelado)
        ]);
      }
    });

  // Consolidation Totals Row
  consolBody.push([
    'TOTAL',
    formatCurrency(consolidation.somaTotalIntegral),
    '-',
    formatCurrency(consolidation.somaParcelaIntegral),
    formatCurrency(consolidation.somaTotalProporcional),
    formatCurrency(consolidation.somaParcelaProporcional),
    formatCurrency(consolidation.somaTotalGeral),
    formatCurrency(consolidation.somaTotalGeralParcelado)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: consolHead,
    body: consolBody,
    theme: 'grid',
    headStyles: {
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 1.2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 1,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      // Highlight Totals Row
      if (data.row.index === consolBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        if (data.column.index <= 3) {
          data.cell.styles.fillColor = [254, 215, 170]; // Light orange
        } else if (data.column.index <= 5) {
          data.cell.styles.fillColor = [254, 240, 138]; // Light yellow
        } else {
          data.cell.styles.fillColor = [225, 235, 245]; // Light navy
          data.cell.styles.textColor = colorNavy;
        }
      }
    }
  });

  // 5. Signatures & Operator Block
  let finalY = (doc as any).lastAutoTable.finalY + 12;

  // Check page overflow
  if (finalY > pageHeight - 30) {
    doc.addPage();
    finalY = 25;
  }

  doc.setLineWidth(0.3);
  doc.setDrawColor(148, 163, 184);

  // Left signature
  doc.line(20, finalY + 12, 90, finalY + 12);
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Responsável Técnico / Recursos Humanos', 55, finalY + 16, { align: 'center' });
  doc.text('Prefeitura Municipal de Rio Verde', 55, finalY + 20, { align: 'center' });

  // Right signature
  doc.line(120, finalY + 12, 190, finalY + 12);
  doc.text('Visto da Chefia / De Acordo', 155, finalY + 16, { align: 'center' });
  doc.text('Fundo Municipal de Saúde', 155, finalY + 20, { align: 'center' });

  // Save PDF file
  const fileNameClean = (server.nome || 'Servidor').replace(/\s+/g, '_');
  doc.save(`Laudo_Progressao_Consolidado_${fileNameClean}_${params.mesInicial.replace('/', '-')}_a_${params.mesFinal.replace('/', '-')}.pdf`);
};
