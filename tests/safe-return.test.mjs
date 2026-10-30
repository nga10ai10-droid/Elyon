import assert from 'node:assert/strict';
import test from 'node:test';
import {safeReturnPath} from '../lib/safe-return.ts';

test('post-login return path stays on this site',()=>{
  assert.equal(safeReturnPath('/cart'),'/cart');
  assert.equal(safeReturnPath('/cart?item=1'),'/cart?item=1');
  for(const value of [undefined,'https://example.com','//example.com','/\\example.com','/\n/evil','javascript:alert(1)']){
    assert.equal(safeReturnPath(value),'',`Rejected unsafe return path: ${value}`);
  }
});
