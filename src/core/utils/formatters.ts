/**
 * Formata um número para o padrão de moeda brasileiro R$ (BRL)
 */
export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formata um número para porcentagem (ex: 6.12 -> "6,12%")
 */
export const formatPercent = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0,00%';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + '%';
};

/**
 * Formata uma string de competência "MM/YYYY" para nome extenso legível
 */
export const formatCompetenciaLabel = (comp: string): string => {
  if (!comp || !comp.includes('/')) return comp;
  const [mesStr, ano] = comp.split('/');
  const mesNum = parseInt(mesStr, 10);
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro', '13º Salário'
  ];
  const nomeMes = meses[mesNum - 1] || mesStr;
  return `${nomeMes}/${ano}`;
};
