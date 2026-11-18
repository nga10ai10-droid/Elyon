# ELYON · instrucciones para Claude Code

Tienda online de la marca de ropa deportiva **ELYON** (elyonwear.com). Propietario: Aitor. Idioma de trabajo y de la web: **español**. Respuestas cortas, directas y listas para usar; no le gustan las explicaciones largas.

## Cómo se publica
- Repo: `nga10ai10-droid/Elyon`, rama `main`. Cloudflare **Workers Builds** (worker `elyon-store`) publica solo cada vez que cambia `main`.
- Flujo preferido (igual que en Zonavag): trabajar en una rama (`mejora/...`, `datos/...`), abrir un Pull Request y que Aitor lo acepte. No subir a `main` sin avisar si el cambio es grande.
- `postinstall` compila la web solo cuando existe `WORKERS_CI`; el comando de despliegue en Cloudflare es `npx wrangler deploy`. Node fijado en `.node-version`.
- Antes de subir: `npm run build`, `npx eslint <archivos tocados>` y `node --test tests/*.test.mjs` (deben pasar todos).
- Si `npm run dev` falla por `compatibility_date` en `wrangler.toml`, cámbiala solo en local y **no la subas**.

## Stack
Next.js sobre `vinext` + Cloudflare Workers, D1 (base de datos), R2 (imágenes), Firebase Auth, Stripe Checkout. Catálogo inicial en `lib/products.ts`; el panel `/admin` gestiona precios, stock e imágenes. SEO y datos estructurados en `lib/seo.ts`. Estilos en `app/globals.css`. Más detalle en `README-ELYON.md` y `README.md`.

## Reglas que no se rompen
- Las páginas privadas llevan `noindex` y están bloqueadas en robots: `/admin`, `/account`, `/cart`, `/checkout`, `/api/`. No tocar la indexación del resto (la web ya está en Google y recibe clics).
- No subir claves, tokens ni `.env`. La única clave que puede ir en el código es la pública de Firebase para el navegador.
- Las ventas **aún no están abiertas**: el pago está bloqueado y los productos salen como "agotado" en los datos de producto. No cambiar esto sin que Aitor lo pida.
- Aitor vende como particular (sin alta de autónomo): no publicar DNI/NIF ni domicilio en la web.
- No inventar datos de producto (gramaje, medidas, composición). Si no los sabes, pregúntale.

## Condiciones reales de venta
Envíos solo a España con GLS: 7 € por pedido, gratis desde 69,99 €. Preparación 1–2 días, entrega 1–3. Devoluciones: 14 días naturales, el coste de vuelta lo paga el cliente (salvo prenda defectuosa o equivocada), recibidas en el Estanco Royal de Las Lagunas de Mijas. Precios con IVA incluido. Contacto: elyonwearspain@gmail.com, lunes a viernes 10:00–18:00.

## Marca y diseño
Minimalista: negro, blanco y gris; tipografía Inter muy gruesa en titulares; logo = pájaro "Y" + ELYON. Lema: "Evoluciona. Supérate." Tono sobrio: "sin gráficos que griten, sin promesas imposibles". No quiere que se hable de "drop" en la comunicación de la marca. No quiere salir él en vídeos.

## Estado y pendientes (nov 2026)
- Prendas reales ya fabricadas: camisetas y **sudadera oversize negra, 80 % algodón / 20 % poliéster reciclado, 320 g/m²** (logo pequeño delante, "ELYON" grande en la espalda). Las fotos de la web siguen siendo imágenes conceptuales hechas con IA; hay que sustituirlas por fotos reales.
- Fotos limpias de la sudadera ya en `public/assets/products/sudadera-negro-frontal.webp` y `sudadera-negro-espalda.webp` (más versiones `-small`). Ya está en el catálogo (`sudadera-oversize`, 39,95 €, preview, categoría Sudaderas, tallas XS–XXL). Falta sustituir las fotos por imágenes del mismo estilo que el resto y confirmar los cuidados de lavado.
- Revisar en Search Console las páginas no indexadas y en Merchant Center los avisos de productos.
- Abrir ventas: configurar Stripe, webhook y correos (ver `README-ELYON.md`, "Antes de activar ventas").
- Mejora continua de diseño y rendimiento móvil de la web.
