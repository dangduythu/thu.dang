const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
test('Windows shell syntax and secure context isolation',()=>{
  const main=fs.readFileSync(path.join(root,'desktop','main.cjs'),'utf8');
  const preload=fs.readFileSync(path.join(root,'desktop','preload.cjs'),'utf8');
  new vm.Script(main);
  new vm.Script(preload);
  assert.match(main,/contextIsolation:true/);
  assert.match(main,/nodeIntegration:false/);
  assert.match(main,/setWindowOpenHandler\(\(\)=>\(\{action:'deny'\}\)\)/);
  assert.match(main,/mathkid:save-backup/);
  assert.match(main,/mathkid:open-backup/);
  assert.match(main,/registerSchemesAsPrivileged/);
});
test('shared learning code and versioned reward data remain present',()=>{
  const app=fs.readFileSync(path.join(root,'App.js'),'utf8');
  for(const marker of ['OceanScene','SplashArt','DRAG_GAMES','screen === \'shop\'','screen === \'reviewPlan\'','screen === \'curriculumLesson\'','desktopBridge','openDesktopBackup','progressSummary','BackHandler'])assert.ok(app.includes(marker),'Missing '+marker);
  const storage=fs.readFileSync(path.join(root,'ProgressStorage.js'),'utf8');
  assert.ok(storage.includes("mathkid4_v1_progress"));
  for(const field of ['starSpent','ownedRewards','equippedReward','lessonsDone','lessonChecks'])assert.ok(storage.includes(field));
});
test('Windows packaging retains bundled offline web assets',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
  assert.equal(pkg.build.extraMetadata.main,'desktop/main.cjs');
  assert.ok(pkg.build.files.includes('dist/**/*'));
  assert.equal(app.expo.web.bundler,'metro');
  assert.equal(app.expo.web.output,'single');
  assert.match(pkg.scripts['desktop:package'],/electron-builder/);
});
