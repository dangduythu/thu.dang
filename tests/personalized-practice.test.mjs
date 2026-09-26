import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../PersonalizedPractice.js',import.meta.url),'utf8');
const {mistakeType,recentMistakes,topicTrends,dailyReviewPlan}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const bad={id:'n-round-124-10',topic:'numbers',question:'Làm tròn số 124',answer:120,correct:false};
assert.equal(mistakeType(bad),'Làm tròn số');
assert.equal(recentMistakes([{answers:[bad]}]).length,1);
assert.equal(recentMistakes([{answers:[{...bad,correct:true}]},{answers:[bad]}]).length,0);
const history=[{answers:Array.from({length:10},(_,i)=>({id:'new'+i,topic:'fractions',question:'So sánh phân số',answer:2,correct:i<8}))},
  {answers:Array.from({length:10},(_,i)=>({id:'old'+i,topic:'fractions',question:'So sánh phân số',answer:2,correct:i<4}))}];
const trend=topicTrends(history).find(x=>x.topic==='fractions');
assert.equal(trend.change,40);
assert.equal(trend.sample,10);
assert.equal(dailyReviewPlan(history).topic,'fractions');
assert.equal(topicTrends([]).length,9);
assert.ok(topicTrends([]).every(t=>t.change===null&&t.status==='Cần thêm dữ liệu'));
assert.equal(recentMistakes([],5).length,0);
console.log('PASS: latest mistake queue, error categories, cautious trend and 15-minute review plan');
