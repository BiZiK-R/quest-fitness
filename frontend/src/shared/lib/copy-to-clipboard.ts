/** Запись текста в буфер обмена (обёртка для тестов и единой точки вызова). */
export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
