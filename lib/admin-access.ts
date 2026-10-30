export function isAdminIdentity(
  user:{id:string|null;email:string|null},
  primaryEmail:string,
  additionalEmail:string,
  adminUserId:string,
){
  if(!user.id)return false;
  if(adminUserId&&user.id===adminUserId)return true;
  const email=user.email?.trim().toLowerCase();
  return !!email&&[primaryEmail,additionalEmail].some(allowed=>allowed.trim().toLowerCase()===email);
}
