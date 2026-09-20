// Strong right-to-left scripts.
const rtl =
  /[\p{Script=Hebrew}\p{Script=Arabic}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Samaritan}\p{Script=Mandaic}]/u;

export function containsRTL(text: string): boolean {
  return rtl.test(text);
}
