import {arcSizeGuide} from '@/lib/size-guides';

export function ArcSizeGuide() {
  return <div className="size-guide">
    <table>
      <caption>ARC Oversized Tee · medidas en cm</caption>
      <thead><tr><th scope="col">Talla</th><th scope="col">Ancho</th><th scope="col">Largo</th></tr></thead>
      <tbody>{arcSizeGuide.rows.map(row => <tr key={row.size}><th scope="row">{row.size}</th><td>{row.width}</td><td>{row.length}</td></tr>)}</tbody>
    </table>
    <p>Compara con una camiseta que ya te guste: extiéndela sin estirarla y mide el ancho de axila a axila y el largo del hombro al bajo. El ancho es de la prenda en plano, no el contorno de tu pecho.</p>
    <p>Medidas orientativas de ARC, pendientes de comprobar con una prenda física. Esta tabla no se aplica a CORE ni a PERFORMANCE.</p>
  </div>;
}
