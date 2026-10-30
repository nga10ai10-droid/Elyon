// Tarifa de envío de ELYON (España peninsular y Baleares, GLS). Precios en céntimos, IVA incluido.
export const SHIPPING_CENTS_DEFAULT=700;          // 7,00 €
export const FREE_SHIPPING_FROM_CENTS_DEFAULT=6999; // envío gratis desde 69,99 €
export function shippingFor(subtotalCents:number,flat=SHIPPING_CENTS_DEFAULT,freeFrom=FREE_SHIPPING_FROM_CENTS_DEFAULT){return subtotalCents>=freeFrom?0:flat}
