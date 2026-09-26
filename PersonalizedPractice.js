// V7.5: deterministic, offline learning suggestions from existing V6/V7 answer history.
// No remote API, no new user profile or replacement of old progress.
export const PRACTICE_TOPICS = ['numbers','add','multiply','divide','fractions','geometry','units','word','patterns'];

function allAnswers(history) {
  return (Array.isArray(history) ? history : []).flatMap(h=>
    Array.isArray(h?.answers) ? h.answers.slice().reverse() : []
  ); // newest sessions first, newest answer within each session first
}
export function mistakeType(a) {
  const id=String(a?.id||'');
  const q=String(a?.question||'').toLowerCase();
  switch(a?.topic){
    case 'numbers':return /round|làm tròn/.test(id+' '+q)?'Làm tròn số':/place|hàng/.test(id+' '+q)?'Giá trị hàng':'So sánh và cấu tạo số';
    case 'add':return /sub|−|trừ/.test(id+' '+q)?'Phép trừ':'Phép cộng';
    case 'multiply':return 'Phép nhân';
    case 'divide':return 'Phép chia';
    case 'fractions':return /compare|so sánh/.test(id+' '+q)?'So sánh phân số':/reduce|rút gọn/.test(id+' '+q)?'Rút gọn phân số':'Phân số bằng nhau';
    case 'geometry':return /chu vi/.test(q)?'Chu vi':'Diện tích và hình học';
    case 'units':return 'Đổi đơn vị';
    case 'word':return 'Toán có lời văn';
    case 'patterns':return 'Quy luật dãy số';
    default:return 'Ôn kiến thức';
  }
}
export function recentMistakes(history, limit=5) {
  const seen=new Set(), rows=[];
  for(const a of allAnswers(history)){
    if(!a || !a.topic || a.answer===undefined || !a.question)continue;
    const key=String(a.id||a.topic+'|'+a.question);
    if(seen.has(key))continue;
    seen.add(key);
    if(!a.correct){
      rows.push({...a,id:key,kind:mistakeType(a)});
      if(rows.length>=limit)break;
    }
  }
  return rows;
}
export function topicTrends(history){
  const all=allAnswers(history).filter(a=>a&&PRACTICE_TOPICS.includes(a.topic));
  return PRACTICE_TOPICS.map(topic=>{
    const rows=all.filter(a=>a.topic===topic);
    const latest=rows.slice(0,10),previous=rows.slice(10,20);
    const newRate=latest.length?latest.filter(a=>a.correct).length/latest.length:null;
    const oldRate=previous.length?previous.filter(a=>a.correct).length/previous.length:null;
    // Require at least 5 in both windows before describing movement.
    const change=latest.length>=5 && previous.length>=5
      ?Math.round((newRate-oldRate)*100):null;
    const types={};
    for(const a of latest.filter(a=>!a.correct)){const kind=mistakeType(a);types[kind]=(types[kind]||0)+1;}
    const topMistake=Object.entries(types).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
    return {topic,total:rows.length,sample:latest.length,correct:latest.filter(a=>a.correct).length,
      rate:newRate,change,topMistake,status:latest.length<5?'Cần thêm dữ liệu':
        newRate<.7?'Nên ôn tập':newRate>=.9?'Có thể thử nâng cao':'Tiếp tục luyện tập'};
  });
}
export function dailyReviewPlan(history, done=[]){
  const mistakes=recentMistakes(history,5);
  const completed=Array.isArray(done)?done.length:0;
  const weakest=topicTrends(history).filter(t=>t.sample>=5)
    .sort((a,b)=>a.rate-b.rate||b.sample-a.sample)[0];
  return {mistakes,topic:weakest?.topic||mistakes[0]?.topic||'add',
    level:weakest && weakest.rate<.6?'Cơ bản':'Khá',
    steps:[{minutes:3,title:'Ôn ví dụ',detail:'Đọc lại quy tắc và một ví dụ đã giải.'},
           {minutes:9,title:'Luyện tập',detail:mistakes.length?'Làm lại tối đa 5 câu từng sai; sau đó luyện chủ đề đề xuất.':'Luyện chủ đề đề xuất để tạo dữ liệu học tập.'},
           {minutes:3,title:'Tự kiểm tra',detail:'Xem lời giải, tự nói lại cách làm và ghi điều cần nhớ.'}],
    completedCards:completed};
}
