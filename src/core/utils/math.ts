/**
 * Arredonda um valor financeiro para 2 casas decimais com precisão
 */
export const roundMoney = (val: number): number => {
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

/**
 * Converte string no formato PT-BR "1.234,56" para número 1234.56
 */
export const parseBrazilianNumber = (str: string): number => {
  if (!str) return 0;
  // Remove pontos de milhar e substitui vírgula decimal por ponto
  const cleanStr = str.trim().replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
};
