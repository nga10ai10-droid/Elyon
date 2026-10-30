import {database,requireUser,responseError} from '@/lib/commerce';
export async function GET(){try{
  const user=await requireUser();
  const db=database();
  // A transaction gives a consistent snapshot. Every query is scoped to the trusted user ID.
  const queries=[
    'SELECT name,created,updated FROM member_profiles WHERE user_id=?',
    'SELECT data,updated FROM addresses WHERE user_id=?',
    'SELECT id,status,total,shipping,email,address,tracking,created FROM orders WHERE user_id=? ORDER BY created',
    'SELECT l.order_id,l.sku,l.name,l.quantity,l.unit_price FROM order_lines l JOIN orders o ON o.id=l.order_id WHERE o.user_id=?',
    'SELECT b.id,b.updated,l.sku,l.quantity FROM bags b LEFT JOIN bag_lines l ON l.bag_id=b.id WHERE b.user_id=?',
    'SELECT id,status,created FROM privacy_requests WHERE user_id=?'
  ];
  const [profile,address,orders,lines,bags,requests]=await db.batch(queries.map(q=>db.prepare(q).bind(user.id)));
  const data={format:'elyon-account-export-v1',exportedAt:new Date().toISOString(),scope:'Datos vinculados a esta identidad privada. No incluye consultas o compras realizadas fuera de la sesión ni datos guardados por otros proveedores.',identity:{id:user.id,email:user.email},profile:profile.results,address:address.results,orders:orders.results,orderLines:lines.results,bags:bags.results,privacyRequests:requests.results};
  return new Response(JSON.stringify(data,null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="elyon-mis-datos.json"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}catch(e){return responseError(e)}}
