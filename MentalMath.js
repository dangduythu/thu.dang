// MathKid V8.4: reproducible arithmetic training, no network, integer answers.
// Digits select the MULTIPLIER or DIVISOR (1, 2 or 3 digits).
export const MENTAL_OPERATIONS = Object.freeze([{id:'multiply',label:'Phép nhân ×'},{id:'divide',label:'Phép chia ÷'},{id:'mixed',label:'Trộn nhân và chia'}]);
export const FACTOR_DIGITS = Object.freeze([1,2,3]);
const range = digits => [digits===1?2:10**(digits-1),10**digits-1];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Math.floor(Number(v)||min)));
const format = x=>String(x).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
function hash(seed){let x=(seed>>>0)||123456789;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
function randint(r,min,max){return min+Math.floor(r()*(max-min+1));}
function tensHint(n) {
  const powers=[1000,100,10];
  const place=powers.find(p=>n>=p)||1;
  const high=Math.floor(n/place)*place,rem=n-high;
  return rem?{high,rem}:{high:n,rem:0};
}
export function generateMentalSet({operation='mixed',digits=1,count=10,seed=1}={}){
  if(!MENTAL_OPERATIONS.some(o=>o.id===operation))throw Error('Invalid operation');
  if(!FACTOR_DIGITS.includes(digits))throw Error('Choose 1, 2 or 3 digits');
  const total=clamp(count,1,20), r=hash(seed);
  const [min,max]=range(digits), out=[],used=new Set();
  for(let i=0;i<total;i++){
    const op=operation==='mixed'?(i%2===0?'multiply':'divide'):operation;
    let factor,other,signature,attempt=0;
    do{
      factor=randint(r,min,max);
      // Larger numbers for one-digit factors, manageable quotient for 3-digit divisors.
      other=randint(r,digits===1?101:digits===2?104:12,digits===1?9999:digits===2?999:999);
      signature=op+'-'+factor+'-'+other;
    }while(used.has(signature)&&++attempt<250);
    used.add(signature);
    const dividend=factor*other;
    const answer=op==='multiply'?dividend:other;
    const piece=tensHint(other);
    const question=op==='multiply'? `${format(other)} × ${format(factor)} = ?`:
      `${format(dividend)} : ${format(factor)} = ?`;
    const explanation=op==='multiply'
      ?piece.rem?`Tách ${format(other)} = ${format(piece.high)} + ${format(piece.rem)}. Tính ${format(piece.high)} × ${format(factor)} + ${format(piece.rem)} × ${format(factor)} = ${format(answer)}.`:
      `${format(other)} × ${format(factor)} = ${format(answer)}.`
      :`Kiểm tra bằng phép nhân: ${format(factor)} × ${format(other)} = ${format(dividend)}. Thương là ${format(other)}.`;
    out.push({id:'mental-'+(seed>>>0)+'-'+i+'-'+signature,topic:op==='multiply'?'multiply':'divide',
      level:digits===1?'Cơ bản':digits===2?'Khá':'Nâng cao',operation:op,digits,
      question,answer,explanation,dividend,divisor:factor,factor,other});
  }
  return out;
}
