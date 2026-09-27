import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const imp=async name=>import('data:text/javascript;base64,'+Buffer.from(readFileSync(new URL('../'+name,import.meta.url),'utf8')).toString('base64'));
const {generateMentalSet}=await imp('MentalMath.js');
const {REAL_REWARDS,remainingStars,redeemRealReward,markRewardDelivered}=await imp('RealRewards.js');
const {normalizeProgress,makeBackup,parseBackup,PROGRESS_KEY}=await imp('ProgressStorage.js');
const {backDestination}=await imp('Navigation.js');
for(const digits of [1,2,3])for(const operation of ['multiply','divide','mixed'])for(let seed=1;seed<=40;seed++){
  const rows=generateMentalSet({digits,operation,count:20,seed});
  assert.equal(rows.length,20);
  assert.equal(new Set(rows.map(x=>x.id)).size,20);
  for(const q of rows){
    assert.equal(String(q.factor).length,digits);
    assert.equal(q.dividend,q.factor*q.other);
    assert.equal(q.answer,q.operation==='divide'?q.other:q.dividend);
    assert.ok(Number.isInteger(q.answer)&&q.answer>0&&q.question&&q.explanation);
    if(operation!=='mixed')assert.equal(q.operation,operation);
  }
}
assert.throws(()=>generateMentalSet({digits:4}));
assert.throws(()=>generateMentalSet({operation:'subtract'}));
assert.equal(backDestination('mental'),'home');
assert.equal(backDestination('quiz','mental'),'mental');
assert.deepEqual(REAL_REWARDS.map(x=>x.price),[30,200]);
const old=normalizeProgress({history:[{total:24}],seen:[],stars:260,starSpent:0,
  badges:['A'],lessonsDone:['MK4-001'],ownedRewards:['explorer'],equippedReward:'explorer'});
assert.equal(PROGRESS_KEY,'mathkid4_v1_progress');
const ice=redeemRealReward(old,'icecream','reward-unique-0001');
assert.equal(ice.ok,true);
assert.equal(remainingStars(ice.progress),230);
const ball=redeemRealReward(ice.progress,'ballpit','reward-unique-0002');
assert.equal(ball.ok,true);
assert.equal(remainingStars(ball.progress),30);
assert.equal(redeemRealReward(ball.progress,'ballpit','reward-unique-0003').reason,'insufficient');
assert.equal(redeemRealReward(ball.progress,'icecream','reward-unique-0002').reason,'duplicate');
const again=redeemRealReward(ball.progress,'icecream','reward-unique-0004');
assert.equal(again.ok,true); // the same ice cream can be redeemed repeatedly
assert.equal(remainingStars(again.progress),0);
assert.equal(again.progress.stars,260);
assert.equal(again.progress.ownedRewards[0],'explorer');
assert.equal(again.progress.history[0].total,24);
assert.equal(again.progress.redemptions.length,3);
const delivered=markRewardDelivered(again.progress,'reward-unique-0001');
assert.equal(delivered.ok,true);
assert.equal(delivered.progress.redemptions.find(x=>x.id==='reward-unique-0001').status,'delivered');
assert.equal(markRewardDelivered(delivered.progress,'reward-unique-0001').ok,false);
const restored=parseBackup(JSON.stringify(makeBackup(delivered.progress,'general')));
assert.equal(restored.redemptions.length,3);
assert.equal(restored.redemptions.find(x=>x.id==='reward-unique-0001').status,'delivered');
assert.equal(restored.starSpent,260);
assert.equal(restored.stars,260);
assert.equal(restored.ownedRewards[0],'explorer');
console.log('PASS: 7200 mental questions, exact arithmetic, repeatable vouchers, legacy data and JSON backup');
