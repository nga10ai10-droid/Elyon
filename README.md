# ELYON · tienda online

Aplicación full-stack para el catálogo y venta de ropa deportiva ELYON. Incluye catálogo de cuatro columnas, fichas por color y talla, inventario transaccional, carrito persistente, pedidos, checkout con Stripe, cuenta privada con Firebase, panel de administración, borradores legales y cola de confirmaciones por correo.

## Antes de abrir las ventas

Entra en `/admin` y revisa el apartado **Lanzamiento**. La tienda debe permanecer con `COMMERCE_MODE=preview` hasta que el panel muestre que prendas, stock, pagos y correos están preparados. Los textos legales están en `lib/legal.ts`.

No pongas claves en el ZIP ni en el repositorio. Configúralas únicamente en el entorno de alojamiento:

- `ADMIN_EMAIL` o `ADMIN_USER_ID`: persona autorizada para administrar. `ADMIN_EXTRA_EMAIL` permite añadir una segunda cuenta sin retirar el acceso de la primera; la cuenta debe iniciar sesión con Firebase usando esa dirección.
- `SITE_ORIGIN`: dominio público definitivo, con `https://`.
- `SUPPORT_EMAIL` e `INSTAGRAM_URL`: contacto visible.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` y `SHIPPING_CENTS`: cobro y portes.
- `RESEND_API_KEY` y `EMAIL_FROM`: confirmaciones de pedido y envío. `EMAIL_FROM` admite formatos como `ELYON <pedidos@dominio.es>`.
- `COMMERCE_MODE`: `preview`, `test` o `live`.

La cola de correo usa claves de idempotencia y reintenta hasta cinco veces. Si un envío queda pendiente, puede relanzarse desde **Lanzamiento**. El marcado de un pedido como enviado genera su confirmación de transporte.

## Verificación

Ejecuta `npm test`. La prueba construye el Worker y comprueba inventario, concurrencia, pagos, permisos, cuenta, privacidad, documentos y configuración de lanzamiento.

## Despliegue en Cloudflare Workers

Requiere Node.js 22.13 o superior y una cuenta Cloudflare que tenga la base D1 `elyon-db` (ID `2620c34d-9aa3-40de-bffb-c2470479350a`) y el bucket R2 `elyon-images`. Los bindings `DB`, `BUCKET`, `ASSETS` e `IMAGES` están declarados en `wrangler.toml` y Vite los lee directamente. No hacen falta herramientas de ChatGPT Sites.

1. Instala dependencias con `npm ci` y autentica Wrangler con `npx wrangler login` en tu propia cuenta.
2. Prepara el esquema de la base D1 aplicando, en orden, los archivos SQL de `drizzle/` a la base remota. Comprueba el estado de las migraciones antes de activar la tienda. Este paso afecta a datos reales y no se ejecuta durante el build.
3. Define los secretos de producción en Cloudflare, sin añadirlos al repositorio ni al ZIP. Por ejemplo, `npx wrangler secret put STRIPE_SECRET_KEY` y el mismo comando para las demás claves privadas. Las variables de configuración figuran en `.env.example`; valores como `COMMERCE_MODE=preview` deben permanecer cerrados hasta terminar la configuración de venta.
4. Ejecuta `npm run build` y después `npx wrangler deploy` (o `npm run deploy`). El plugin de Cloudflare genera el Worker y una configuración de despliegue a partir de `wrangler.toml`. `npx wrangler deploy --dry-run` permite comprobar el paquete sin publicarlo.

Si el bucket R2 todavía no existe en esa cuenta, créalo antes de publicar: `npx wrangler r2 bucket create elyon-images`. Asegúrate de tener configurados el dominio, Firebase, Stripe, el correo de confirmaciones y los documentos legales reales antes de cambiar a ventas en vivo. Los nombres de los bindings de Wrangler no guardan credenciales ni configuran por sí solos los servicios externos.

Para desarrollo local, `npm run dev` inicia Vite con bindings simulados por el plugin Cloudflare. `npm test` construye el Worker y ejecuta las pruebas existentes. `npm run db:generate` genera migraciones Drizzle cuando cambie el esquema.

## Colección de mujer

CORE Racer Top y FLOW Square Top están disponibles en negro, blanco y gris. FORM Legging Largo y FORM Short (corte corto aprobado) se presentan en negro y gris. Los leggings llevan el símbolo delante y ELYON discreto centrado en la cintura trasera. Cada variante del catálogo dispone de una foto frontal y una trasera. Las imágenes y miniaturas están en `public/assets/products/`.

Las imágenes son propuestas generadas, no fotografías de prendas fabricadas. Los precios visibles se han fijado tras revisar referencias de ropa deportiva en España en septiembre de 2026: camisetas 24,95–34,95 €, pantalón corto de hombre 32,95 €, tops 26,95–29,95 €, legging largo 39,95 € y legging corto 29,95 €. Son precios publicados en el catálogo; hay que contrastar el margen con el coste real de fabricación, envíos, impuestos y devoluciones antes de abrir las ventas. Los productos siguen en vista previa y el stock inicial permanece a cero hasta validar la producción. El código actualiza el precio de los registros iniciales en vista previa sin alterar los importes personalizados ni productos activados. Las variantes blancas de leggings se retiran del catálogo; cualquier selección antigua puede eliminarse desde la bolsa.
