# ELYON · guía de gestión y lanzamiento

## Estado de esta entrega

Tienda preparada para revisión, con catálogo, bolsa, Firebase Authentication, panel y conexión a Stripe Checkout. **No está abierta a ventas reales.** Para instalarla en Cloudflare Workers sigue `README.md`; el registro, los pagos y los correos requieren configurar y comprobar los servicios reales de esa cuenta.

Las imágenes son visualizaciones de diseño. ARC, CORE y PERFORMANCE tienen vistas frontal y trasera y tres colores. El catálogo inicial está en vista previa y su stock comienza a cero. Validar muestras físicas, medidas, composición, fotos y precios antes de vender. Los artículos de mujer también son propuestas.

## Gestionar la tienda

1. Accede con la cuenta propietaria a `/account` y pulsa **Gestionar mi tienda**, o abre `/admin`.
2. Si el catálogo aún está vacío en gestión, importa la colección inicial con su botón. La importación no sobrescribe prendas ya guardadas.
3. Edita nombre, descripción, ajuste, precio final, cuidados y medidas. Añade colores e imágenes (JPG/PNG/WebP de hasta 5 MB; máximo seis por color). La primera imagen es la portada y la segunda debe mostrar la espalda en camisetas.
4. Guarda primero la prenda y después sus existencias por talla y color. Para retirar una prenda, ocúltala; no borres historial de pedidos.
5. Los textos legales están en `lib/legal.ts` y se publican con cada despliegue; para cambiarlos, edita ese archivo.
6. En **Pedidos** consulta unidades, prendas, importe, dirección y seguimiento. Solo un pedido pagado admite marcarse como enviado. Reembolsos: gestionar en Stripe; su sincronización y reposición de stock no están automatizadas.
7. **Contacto** recoge consultas cuando se habilita la recepción. Los mensajes se guardan en el panel; no se envían correos todavía.

## Antes de activar ventas

- Configurar Cloudflare Workers, D1 y R2 según `README.md`, y definir dominio y origen HTTPS antes de activar pagos.
- Probar de extremo a extremo Firebase Authentication: registro, verificación, recuperación, inicio de sesión y bloqueo del checkout sin correo verificado.
- Configurar Resend y el remitente verificado para la cola `outbox`, comprobar un correo de pedido real y configurar recibos de Stripe según proceda.
- Confirmar catálogo, stock y condiciones reales de venta/envío/devolución con el titular. El checkout actual admite España, euros y una tarifa de envío fija; no calcula diferencias territoriales ni impuestos automáticamente. Los precios configurados deben ser los importes finales aplicables. Adaptar cobertura e impuestos antes de admitir territorios con condiciones distintas.
- Configurar Stripe en modo de prueba y registrar `/api/stripe/webhook` con los eventos `checkout.session.completed`, `checkout.session.expired` y `checkout.session.async_payment_succeeded`.
- Verificar una compra de prueba completa: tallas/colores correctos, importe final, pago, webhook firmado, pedido, stock, cancelación y notificación. Las pruebas locales verifican reglas y firma; no acreditan una conexión real a Stripe.
- Tras validar el recorrido completo, cambiar a claves y webhook de producción y realizar una prueba controlada. No basta con introducir una clave secreta.

## Configuración del alojamiento

Configurar valores en el entorno del servidor, nunca en el navegador ni en Git:

| Variable | Uso |
| --- | --- |
| `COMMERCE_MODE` | `preview` por defecto; `test` para validación de Stripe; `live` tras validar el lanzamiento |
| `SITE_ORIGIN` | Origen HTTPS exacto de la web, sin barra final |
| `ADMIN_EMAIL` | Correo del administrador de una cuenta verificada en Firebase |
| `ADMIN_USER_ID` | Alternativa: identificador verificado de Firebase |
| `STRIPE_SECRET_KEY` | Clave secreta del entorno elegido |
| `STRIPE_WEBHOOK_SECRET` | Secreto de firma del endpoint correspondiente |
| `SHIPPING_CENTS` | Tarifa de envío fija, en céntimos |
| `SUPPORT_EMAIL` | Dirección de contacto operativa |
| `INSTAGRAM_URL` | Perfil oficial de marca |

Los pagos permanecen cerrados si falta configuración, falta un documento o quedan marcadores de preparación en los textos publicados. Una prenda de vista previa nunca se cobra. Los secretos no se devuelven al cliente.

## Cuenta privada

- `/account` usa Firebase Authentication con correo y contraseña. El servidor verifica el token firmado; el usuario debe verificar su correo para continuar al pago. Comprueba en tu dominio los enlaces de verificación y recuperación antes del lanzamiento.
- El perfil, las direcciones, pedidos y exportación de datos dependen de la base D1 de tu cuenta. Debes aplicar el esquema y probar una compra completa de prueba.
- Las solicitudes de privacidad y su resolución requieren atención manual del titular; no se borran pedidos automáticamente.

## Borradores legales

En `lib/legal.ts` hay cinco borradores originales: aviso legal, privacidad, cookies, condiciones y formulario de desistimiento. Se preparan para un vendedor establecido en España, circunstancia que el titular debe confirmar. Las páginas ofrecen índice y versión imprimible. El documento de desistimiento no se envía desde el navegador.

En el editor, completa `[[CAMPOS_PENDIENTES]]`, corrige las referencias a servicios todavía no activos y guarda primero como borrador. Las notas de preparación y los marcadores bloquean la publicación tanto en la interfaz como en el servidor. Los textos ya guardados no se sobrescriben al actualizar el código. El titular debe adaptar los borradores a su actividad; eliminar marcadores no certifica cumplimiento.

Datos necesarios: titular, NIF, domicilio, correo y teléfono operativos, datos registrales si proceden, dominio, privacidad, proveedores y transferencias, conservación, inventario real de cookies, impuestos, entrega, devoluciones, facturación, confirmación del contrato y reclamaciones. Ningún dato del titular se ha inventado ni tomado de su perfil personal.

Fuentes oficiales consultadas para preparar los borradores: [LSSI](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758), [normativa de consumidores](https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555), [RGPD](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679) y [guía de cookies de la AEPD](https://www.aepd.es/guias/guia-cookies.pdf). Los textos deben revisarse cuando cambien el alojamiento, la pasarela, las comunicaciones o las condiciones de venta.

## Funcionamiento y mantenimiento

- React/Vinext sobre Cloudflare Workers, D1 para datos y R2 para imágenes subidas. No es una carpeta HTML que pueda funcionar íntegramente en cualquier hosting estático. El despliegue estándar usa los bindings de `wrangler.toml` y la autenticación Firebase.
- El servidor calcula precios y reserva stock en una transacción. La firma del webhook y los importes se validan; las confirmaciones repetidas no duplican pedidos ni descuentos de existencias.
- La sesión de pago reutiliza una clave de idempotencia. Ante un fallo de red, reintentar recupera el mismo pedido. Una reserva sin sesión confirmada con más de 23 horas se bloquea para revisión manual: consultar Stripe antes de liberarla. Las sesiones expiradas se concilian por webhook o al reintentar/cancelar.
- El panel muestra los últimos 100 pedidos y consultas. Preparar exportación, copias de seguridad y procedimientos de atención/reembolso antes de operación sostenida.
- Conservar copias de D1 y R2 por separado del código. Un despliegue de código no es una copia de los datos.
- Las migraciones publicadas son inmutables; añadir nuevas migraciones para cambios de esquema.
- No se han añadido analítica ni píxeles publicitarios. Revaluar consentimiento y privacidad al incorporarlos.
- Para indexación pública, revisar también la etiqueta `robots` del layout antes del lanzamiento; la entrega privada usa `noindex`.

## Comprobaciones de desarrollo

`npm test`: compila y ejecuta pruebas de API, inventario, firma, renderizado y componentes. `npx tsc --noEmit`: verificación de tipos. `scripts/prepare-local-db.mjs` aplica migraciones únicamente a la base local de desarrollo. No incluye credenciales reales ni activa ventas.
