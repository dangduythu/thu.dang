// V8.4.1: 5-second mental sprint. Exact division with 2/3-digit dividend.
// Independent settings: multiplication's multiplier 1/2/3 digits,
// multiplicand 2/3 digits; division uses one-digit divisor (2..9).
export const MENTAL_OPERATIONS=Object.freeze([{id:'multiply',label:'Phép nhân ×'},{id:'divide',label:'Phép chia ÷'},{id:'mixed',label:'Trộn nhân và chia'}]);
export const FACTOR_DIGITS=Object.freeze([1,2,3]);
export const DIVIDEND_DIGITS=Object.freeze([2,3]);
export const MENTAL_COUNTS=Object.freeze([50,100]);
export const SECONDS_PER_QUESTION=5;
const range=d=>[10**(d-1),10**d-1];
const fmt=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const rng=seed=>{let x=(Number(seed)>>>0)||123456789;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};};
const int=(r,lo,hi)=>lo+Math.floor(r()*(hi-lo+1));
function makeOne(r,op,multiplierDigits,dividendDigits,i,seed){
  let multiplier,other,dividend,answer,question,explanation;
  if(op==='multiply'){
    const [min,max]=range(multiplierDigits);
    multiplier=int(r,multiplierDigits===1?2:min,max);
    const [lo,hi]=range(dividendDigits);
    other=int(r,lo,hi);
    answer=other*multiplier;
    question=`${fmt(other)} × ${fmt(multiplier)} = ?`;
    const place=10**Math.floor(Math.log10(other));
    const high=Math.floor(other/place)*place,low=other-high;
    explanation=low?
      `Tách ${fmt(other)} = ${fmt(high)} + ${fmt(low)}. Tính ${fmt(high)} × ${fmt(multiplier)} + ${fmt(low)} × ${fmt(multiplier)} = ${fmt(answer)}.`:
      `${fmt(other)} × ${fmt(multiplier)} = ${fmt(answer)}.`;
    dividend=answer;
  }else{
    // A 2/3-digit dividend divisible by a one-digit divisor.
    multiplier=int(r,2,9);
    const [lo,hi]=range(dividendDigits);
    const minQ=Math.ceil(lo/multiplier),maxQ=Math.floor(hi/multiplier);
    other=int(r,minQ,maxQ);
    dividend=multiplier*other;answer=other;
    question=`${fmt(dividend)} : ${fmt(multiplier)} = ?`;
    explanation=`Kiểm tra bằng nhân: ${fmt(other)} × ${fmt(multiplier)} = ${fmt(dividend)}. Vậy thương là ${fmt(other)}.`;
  }
  return {id:`mental-${seed>>>0}-${i}-${op}-${dividend}-${multiplier}`,
    topic:op==='multiply'?'multiply':'divide',
    level:multiplierDigits===1?'Cơ bản':multiplierDigits===2?'Khá':'Nâng cao',
    operation:op,digits:multiplierDigits,dividendDigits,question,answer,explanation,
    dividend,divisor:multiplier,factor:multiplier,other};
}
export function generateMentalSet({operation='mixed',multiplierDigits=1,dividendDigits=2,count=50,seed=1}={}){
  if(!MENTAL_OPERATIONS.some(o=>o.id===operation))throw Error('Invalid operation');
  if(!FACTOR_DIGITS.includes(multiplierDigits))throw Error('Multiplier requires 1, 2 or 3 digits');
  if(!DIVIDEND_DIGITS.includes(dividendDigits))throw Error('Dividend requires 2 or 3 digits');
  if(!MENTAL_COUNTS.includes(count))throw Error('Session requires 50 or 100 questions');
  const r=rng(seed),list=[],used=new Set();
  for(let i=0;i<count;i++){
    const op=operation==='mixed'?(i%2===0?'multiply':'divide'):operation;
    let question,attempt=0;
    do {question=makeOne(r,op,multiplierDigits,dividendDigits,i,seed);attempt++;}
    while(used.has(question.question)&&attempt<1000);
    if(used.has(question.question))throw Error('Cannot create enough distinct questions');
    used.add(question.question);list.push(question);
  }
  return list;
}
export function mentalStarDelta(correct,total){
  if(!Number.isInteger(correct)||!Number.isInteger(total)||total<=0||correct<0||correct>total)
    throw Error('Invalid score');
  if(correct===total)return 10;
  if(correct*100>total*80)return 3;
  if(correct*2>=total)return 1;
  return -3;
}
export function applyMentalStars(progress,delta){
  const earned=Math.max(0,Math.floor(Number(progress?.stars)||0));
  const spent=Math.max(0,Math.floor(Number(progress?.starSpent)||0));
  // A penalty never creates negative spendable stars or invalidates past redemptions.
  const actual=delta<0?-Math.min(-delta,Math.max(0,earned-spent)):delta;
  return {delta:actual,progress:{...progress,stars:earned+actual}};
}
