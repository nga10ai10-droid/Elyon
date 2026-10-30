# Reserva de inventario en checkout

El descuento de existencias se realiza ahora en `app/api/checkout/route.ts`, en el mismo batch de D1 que crea el pedido y sus líneas. Si una actualización no encuentra existencias suficientes, la inserción de su línea provoca un error de restricción y D1 revierte el batch completo. El checkout devuelve 409 sin solicitar un pago.

La migración `0002_inventory_guards.sql` ya descontaba stock mediante `reserve_inventory`. La nueva migración `0007_checkout_inventory_reservation.sql` elimina únicamente ese trigger para evitar descontar dos veces. No cambia existencias ni pedidos guardados; conserva los triggers de cancelación y de pedido pagado. El nuevo checkout bloquea reservas nuevas mientras detecte el trigger antiguo.

## Actualizar una base existente

Estas instrucciones presuponen que ya se han aplicado las migraciones 0000 a 0006.

1. Pon las ventas en pausa con `COMMERCE_MODE=preview` y deja terminar las solicitudes de checkout que estuvieran en curso.
2. Despliega este código con `npm run build` y `npx wrangler deploy`.
3. Aplica la migración a la base de tu cuenta:

```sh
npx wrangler d1 execute elyon-db --remote --file=drizzle/0007_checkout_inventory_reservation.sql
```

4. Comprueba una reserva y su cancelación con Stripe en modo de prueba antes de volver a activar ventas. No vuelvas a desplegar el checkout antiguo sobre la base ya migrada: ese código dependía del trigger retirado.

Para una base nueva, aplica todos los SQL de `drizzle/` en orden, incluida la migración 0007. No se ha ejecutado ninguna migración remota desde esta entrega.

## Pruebas de esta modificación

```sh
npm run build
node --test tests/checkout-inventory.test.mjs tests/commerce.test.mjs tests/stock-guards.test.mjs
```

La prueba de concurrencia ejecuta el código real de la ruta sobre D1 local y fuerza a ambos intentos a leer stock=1 antes de iniciar sus batches. Firebase, la configuración y la llamada externa a Stripe se sustituyen solo dentro del test; no se envían pagos ni correos reales.
