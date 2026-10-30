/** Only same-site, absolute paths are accepted as post-login destinations. */
export function safeReturnPath(value:string|undefined):string{
  if(!value?.startsWith('/')||value.startsWith('//')||/[\\\u0000-\u001f\u007f]/.test(value))return '';
  try{
    const base='https://elyon.invalid';
    return new URL(value,base).origin===base?value:'';
  }catch{return ''}
}
