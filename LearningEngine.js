// V7 preview: 30 verified numeric check templates x 4 stages.
// This module uses no network calls and never replaces legacy progress.
const checks = [
 n=>['Trong số '+(345612+n*1000)+', chữ số hàng nghìn có giá trị bao nhiêu?',5000+n*1000,'Chữ số hàng nghìn nhân với 1 000.'],
 n=>['Trong số '+(62405+n*1000)+', chữ số hàng nghìn có giá trị bao nhiêu?',2000+n*1000,'Xác định chữ số ở hàng nghìn.'],
 n=>['Số '+(30406+n*1000)+' có bao nhiêu trăm?',Math.floor((30406+n*1000)/100),'Lấy số đã cho chia 100 và lấy phần nguyên.'],
 n=>['Số lớn hơn trong hai số '+(56210+n*100)+' và '+(56120+n*100)+' là số nào?',56210+n*100,'So sánh lần lượt các chữ số từ trái sang phải.'],
 n=>['Làm tròn '+(4768+n*100)+' đến hàng trăm.',4800+n*100,'Xem chữ số hàng chục là 6 nên tăng hàng trăm lên một.'],
 n=>['Số liền trước '+(10000+n*1000)+' là bao nhiêu?',9999+n*1000,'Số liền trước bằng số đã cho trừ 1.'],
 n=>['Tính '+(2475+n*100)+' + 1368.',3843+n*100,'Cộng từng hàng từ phải sang trái.'],
 n=>['Tính '+(5004+n*100)+' − 1276.',3728+n*100,'Đặt tính và trừ từng hàng.'],
 n=>['Tính nhanh 25 + '+(67+n*10)+' + 75.',167+n*10,'Gộp 25 + 75 = 100 rồi cộng số còn lại.'],
 n=>['Tìm x: x + '+(28+n*5)+' = '+(70+n*5)+'.',42,'Lấy tổng trừ số hạng đã biết.'],
 n=>['Tính '+(12+n*2)+' × 5.',60+n*10,'Tách số thành 10 và phần còn lại để nhân với 5.'],
 n=>['Tính '+(37+n*3)+' × 100.',3700+n*300,'Nhân với 100: thêm hai chữ số 0.'],
 n=>['Tính '+(125+n*10)+' × 24.',3000+n*240,'Nhân với 4 và 20 rồi cộng tích riêng.'],
 n=>['Tính nhanh 25 × '+(12+n*4)+'.',300+n*100,'Tách thành 25 × 12 + 25 × 4 × n.'],
 n=>['Tính '+(936+n*12)+' : 12.',78+n,'Kiểm tra thương bằng phép nhân với 12.'],
 n=>['Số dư của phép chia '+(29+n*4)+' : 4 là bao nhiêu?',1,'Số bị chia bằng 4 nhân thương rồi cộng số dư 1.'],
 n=>['Tính '+(3700+n*100)+' : 100.',37+n,'Chia số có hai chữ số 0 cuối cho 100.'],
 n=>['Trong phân số '+(3+n)+'/'+(7+n)+', tử số là bao nhiêu?',3+n,'Tử số nằm phía trên dấu gạch ngang.'],
 n=>['Điền tử số: '+(2+n)+'/'+(3+n)+' = ?/'+(6+n*2)+'.',4+n*2,'Nhân cả tử số và mẫu số với 2.'],
 n=>['Rút gọn '+(6+n*2)+'/'+(8+n*2)+' bằng cách chia cả tử và mẫu cho 2. Tử số mới bằng bao nhiêu?',3+n,'Chia tử số cho 2.'],
 n=>['Cùng mẫu 8, tử số của phân số lớn hơn giữa '+(3+n%2)+'/8 và '+(5+n%2)+'/8 là bao nhiêu?',5+n%2,'Cùng mẫu dương thì tử số lớn hơn cho phân số lớn hơn.'],
 n=>['Góc '+(60+n*5)+' độ là góc nhọn (1) hay góc tù (2)?',1,'Góc lớn hơn 0 và nhỏ hơn 90 độ là góc nhọn.'],
 n=>['Chu vi hình chữ nhật dài '+(12+n)+' cm, rộng 7 cm là bao nhiêu cm?',38+n*2,'Chu vi bằng hai lần tổng chiều dài và chiều rộng.'],
 n=>['Diện tích hình chữ nhật dài '+(12+n)+' cm, rộng 7 cm là bao nhiêu cm²?',84+n*7,'Diện tích bằng chiều dài nhân chiều rộng.'],
 n=>['Diện tích hình vuông cạnh '+(9+n)+' cm là bao nhiêu cm²?',(9+n)*(9+n),'Diện tích hình vuông bằng cạnh nhân cạnh.'],
 n=>['Đổi '+(4+n)+' m ra cm.',(4+n)*100,'Một mét bằng 100 cm.'],
 n=>['Đổi '+(3+n)+' kg ra gam.',(3+n)*1000,'Một kilôgam bằng 1 000 gam.'],
 n=>['Đổi 2 giờ '+(15+n*5)+' phút ra phút.',135+n*5,'Hai giờ bằng 120 phút, cộng số phút còn lại.'],
 n=>['Có '+(200+n*20)+' quả, bán 35 quả rồi 27 quả. Còn bao nhiêu?',138+n*20,'Lấy tổng ban đầu trừ (35 + 27).'],
 n=>['Trung bình cộng của '+(12+n)+', '+(15+n)+', '+(18+n)+' là bao nhiêu?',15+n,'Lấy tổng ba số chia cho 3.']
];
export function makeLessonCheck(lesson) {
  if (!lesson || !Number.isInteger(lesson.number)) return null;
  const base = Math.floor((lesson.number - 1) / 4);
  if (base < 0 || base >= checks.length) return null;
  const stage = lesson.stage || 0;
  const [question, answer, explanation] = checks[base](stage);
  return {id:'check-'+lesson.id,lessonId:lesson.id,topic:lesson.topic,
    question,answer,explanation,level:stage===3?'Nâng cao':stage===0?'Cơ bản':'Khá'};
}
export function evaluateLearning(history=[], checksByLesson={}) {
  const topics=['numbers','add','multiply','divide','fractions','geometry','units','word','patterns'];
  const recent=(Array.isArray(history)?history:[]).flatMap(h=>h.answers||[]).slice(0,120);
  return topics.map(topic=>{
    const rows=recent.filter(a=>a.topic===topic).slice(0,20);
    const total=rows.length, correct=rows.filter(a=>a.correct).length;
    const checked=Object.values(checksByLesson||{}).filter(x=>x&&x.topic===topic);
    const lessonCorrect=checked.filter(x=>x.correct).length;
    const rate=total?correct/total:null;
    return {topic,total,correct,rate,checked:checked.length,lessonCorrect,
      level:total<5?'Khá':rate<.6?'Cơ bản':rate>=.88?'Nâng cao':'Khá',
      status:total<5?'Cần thêm dữ liệu':rate<.7?'Cần ôn tập':rate>=.88?'Có thể thử nâng cao':'Đang luyện tập'};
  });
}
export function recommendLearning(history=[], checksByLesson={}) {
  const all=evaluateLearning(history,checksByLesson);
  return all.filter(x=>x.total>=5).sort((a,b)=>a.rate-b.rate||b.total-a.total)[0]
    || all.find(x=>x.total===0) || all[0];
}
