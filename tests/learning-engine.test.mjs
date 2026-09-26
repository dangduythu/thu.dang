import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../LearningEngine.js',import.meta.url),'utf8');
const {makeLessonCheck,evaluateLearning,recommendLearning}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const expected=[5000,2000,304,56210,4800,9999,3843,3728,167,42,60,3700,3000,300,78,1,37,3,4,3,5,1,38,84,81,400,3000,135,138,15];
assert.equal(expected.length,30);
for(let base=0;base<30;base++){
  for(let stage=0;stage<4;stage++){
    const number=base*4+stage+1;
    const l={id:'MK4-'+String(number).padStart(3,'0'),number,stage,topic:'numbers'};
    const q=makeLessonCheck(l);
    assert.equal(q.id,'check-'+l.id);
    assert.ok(Number.isInteger(q.answer) && q.question && q.explanation);
    if(stage===0)assert.equal(q.answer,expected[base],'base '+base);
  }
}
assert.equal(makeLessonCheck(null),null);
assert.equal(makeLessonCheck({number:121}),null);
const history=[{answers:[{topic:'fractions',correct:false},{topic:'fractions',correct:false},{topic:'fractions',correct:false},{topic:'fractions',correct:false},{topic:'fractions',correct:true}]}];
assert.equal(recommendLearning(history).topic,'fractions');
assert.equal(recommendLearning(history).level,'Cơ bản');
assert.equal(evaluateLearning([],{}).length,9);
console.log('PASS: 120 checks, topic recommendations and empty history');
