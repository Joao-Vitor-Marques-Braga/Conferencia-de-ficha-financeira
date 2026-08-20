export interface ConsolidationItem {
  id: string;
  codigo?: string;
  descricao: string;
  // Bloco 1: TOTAL (Períodos Integrais)
  valorTotalIntegral: number;
  parcelas: number;
  valorParcelaIntegral: number;

  // Bloco 2: PROPORCIONAL (Dias Retroativos)
  diferencaMensalBase: number;
  valorTotalProporcional: number;
  valorParcelaProporcional: number;

  // Bloco 3: TOTAL GERAL
  totalGeral: number;
  totalGeralParcelado: number;
}

export interface ConsolidationSummaryData {
  diasRetroativos: number;
  items: ConsolidationItem[];
  // Totais Bloco 1 (Integral)
  somaTotalIntegral: number;
  somaParcelaIntegral: number;
  // Totais Bloco 2 (Proporcional)
  somaTotalProporcional: number;
  somaParcelaProporcional: number;
  // Totais Bloco 3 (Geral)
  somaTotalGeral: number;
  somaTotalGeralParcelado: number;
}

export interface InstallmentOverrideMap {
  [itemId: string]: number; // ID do evento -> Quantidade de parcelas
}
