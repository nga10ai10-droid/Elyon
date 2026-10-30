import test from 'node:test';
import assert from 'node:assert/strict';
import {legalPages,legalSlugs,isLegalSlug,legalSections} from '../lib/legal.ts';
test('the five legal documents are final, with ELYON data and no placeholders',()=>{
  assert.equal(legalSlugs.length,5);
  for(const d of Object.values(legalPages)){
    assert.doesNotMatch(d.body,/\[\[|\]\]/,'no placeholders');
    assert.doesNotMatch(d.body,/\b(pendiente|borrador|por completar|NIF|DNI|domicilio)\b/i);
    assert.doesNotMatch(d.body,/\.\./,'no double periods');
    assert.ok(d.body.length<12000);
  }
  for(const slug of ['aviso-legal','condiciones','desistimiento'])assert.match(legalPages[slug].body,/Estanco Royal, Camino del Albero, 28, 29651 Las Lagunas de Mijas \(Málaga\)/);
  assert.match(legalPages['aviso-legal'].body,/Aitor Guillén Narbona/);
  assert.match(legalPages.condiciones.body,/7,00 €/);assert.match(legalPages.condiciones.body,/69,99 €/);assert.match(legalPages.condiciones.body,/GLS/);
  assert.equal(isLegalSlug('__proto__'),false);assert.equal(isLegalSlug('constructor'),false);assert.equal(isLegalSlug('desistimiento'),true);
});
test('plain legal documents and sectioned documents remain readable',()=>{
  assert.deepEqual(legalSections('Un párrafo.\n\nOtro párrafo.'),[{heading:'',paragraphs:['Un párrafo.','Otro párrafo.']}]);
  assert.equal(legalSections('## Titular\nMi empresa\n\n## Contacto\nCorreo')[1].heading,'Contacto');
});
