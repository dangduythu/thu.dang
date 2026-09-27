import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const imp=async name=>import('data:text/javascript;base64,'+Buffer.from(readFileSync(new URL('../'+name,import.meta.url),'utf8')).toString('base64'));
const {generateMentalSet,mentalStarDelta,applyMentalStars,SECONDS_PER_QUESTION}=await imp('MentalMath.js');
const {REAL_REWARDS,remainingStars,redeemRealReward,markRewardDelivered}=await imp('RealRewards.js');
const {normalizeProgress,makeBackup,parseBackup,PROGRESS_KEY}=await imp('ProgressStorage.js');
const {backDestination}=await imp('Navigation.js');
for(const dividendDigits of [2,3])for(const multiplierDigits of [1,2,3])
  for(const operation of ['multiply','divide','mixed'])for(let seed=1;seed<=10;seed++)
    for(const count of [50,100]){
      const rows=generateMentalSet({dividendDigits,multiplierDigits,operation,count,seed});
      assert.equal(rows.length,count);
      assert.equal(new Set(rows.map(q=>q.id)).size,count);
      assert.equal(new Set(rows.map(q=>q.question)).size,count);
      for(const q of rows){
        assert.equal(q.dividend,q.factor*q.other);
        assert.equal(q.answer,q.operation==='divide'?q.other:q.dividend);
        assert.ok(Number.isInteger(q.answer)&&q.answer>0&&q.question&&q.explanation);
        if(q.operation==='multiply'){
          assert.equal(String(q.factor).length,multiplierDigits);
          assert.equal(String(q.other).length,dividendDigits);
        }else{
          assert.equal(String(q.dividend).length,dividendDigits);
          assert.ok(q.divisor>=2&&q.divisor<=9&&q.dividend%q.divisor===0);
        }
        if(operation!=='mixed')assert.equal(q.operation,operation);
      }
    }
assert.equal(SECONDS_PER_QUESTION,5);
assert.throws(()=>generateMentalSet({multiplierDigits:4}));
assert.throws(()=>generateMentalSet({dividendDigits:1}));
assert.throws(()=>generateMentalSet({count:20}));
assert.throws(()=>generateMentalSet({operation:'subtract'}));
for(const [correct,total,expected] of [
  [0,50,-3],[24,50,-3],[25,50,1],[40,50,1],[41,50,3],[49,50,3],[50,50,10],
  [49,100,-3],[50,100,1],[80,100,1],[81,100,3],[99,100,3],[100,100,10]
])assert.equal(mentalStarDelta(correct,total),expected);
assert.deepEqual(applyMentalStars({stars:9,starSpent:8},-3),{delta:-1,progress:{stars:8,starSpent:8}});
assert.deepEqual(applyMentalStars({stars:0,starSpent:0},-3),{delta:0,progress:{stars:0,starSpent:0}});
assert.equal(Object.is(applyMentalStars({stars:0,starSpent:0},-3).delta,-0),false);
assert.equal(applyMentalStars({stars:10,starSpent:2},10).progress.stars,20);
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
console.log('PASS: 27000 mental questions, timed sprint thresholds, repeatable vouchers, legacy data and JSON backup');
