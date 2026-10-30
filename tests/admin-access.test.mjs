import test from 'node:test';
import assert from 'node:assert/strict';
import {isAdminIdentity} from '../lib/admin-access.ts';

test('additional admin can sign in while the original account retains access',()=>{
  const primary='owner@example.com',additional='elyonwearspain@gmail.com';
  assert.equal(isAdminIdentity({id:'owner-id',email:primary},primary,additional,''),true);
  assert.equal(isAdminIdentity({id:'business-id',email:'ELYONWEARSPAIN@gmail.com'},primary,additional,''),true);
  assert.equal(isAdminIdentity({id:'visitor-id',email:'visitor@example.com'},primary,additional,''),false);
  assert.equal(isAdminIdentity({id:null,email:additional},primary,additional,''),false);
  assert.equal(isAdminIdentity({id:'owner-id',email:null},primary,additional,'owner-id'),true);
});
