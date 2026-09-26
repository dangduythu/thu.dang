const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {assetPath}=require('../desktop/paths.cjs');
const root=path.resolve('dist');
test('Windows asset paths stay inside exported application',()=>{
  assert.equal(assetPath(root,'mathkid://app/'),path.join(root,'index.html'));
  assert.equal(assetPath(root,'mathkid://app/_expo/static/js/web/main.js'),path.join(root,'_expo','static','js','web','main.js'));
  assert.throws(()=>assetPath(root,'https://example.com/'));
  assert.throws(()=>assetPath(root,'mathkid://evil/index.html'));
  assert.throws(()=>assetPath(root,'mathkid://app/%5cWindows%5csystem.ini'));
  assert.throws(()=>assetPath(root,'mathkid://app/%00'));
});
