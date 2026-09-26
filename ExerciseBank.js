// MathKid V8.3: deterministic offline bank, 1,000 pre-generated exercises from 9 groups.
// Explicitly templated content, not 1,000 independently editorially reviewed problems.
export const BANK_GROUPS = Object.freeze([
  {id:'numbers',topic:'numbers',title:'Số tự nhiên',count:120,icon:'🔢'},
  {id:'add',topic:'add',title:'Cộng và trừ',count:120,icon:'➕'},
  {id:'multiply',topic:'multiply',title:'Nhân và chia',count:160,icon:'✖️'},
  {id:'quick',topic:'add',title:'Tính nhanh và biểu thức',count:120,icon:'⚡'},
  {id:'fractions',topic:'fractions',title:'Phân số',count:120,icon:'🍰'},
  {id:'geometry',topic:'geometry',title:'Hình học',count:100,icon:'📐'},
  {id:'units',topic:'units',title:'Đại lượng',count:80,icon:'⚖️'},
  {id:'word',topic:'word',title:'Toán có lời văn',count:100,icon:'📚'},
  {id:'patterns',topic:'patterns',title:'Toán tư duy',count:80,icon:'🧠'}
]);
const exercise=(question,answer,explanation,skill)=>({question,answer,explanation,skill});
const nfmt=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
function make(group,n){
  const t=n%8, k=Math.floor(n/8), a=k+2, b=(k%9)+3, c=(k%7)+2;
  switch(group){
    case 'numbers':{
      const base=105234+n*123, place=[10,100,1000][n%3];
      if(t===0)return exercise(`Trong số ${nfmt(base)}, chữ số hàng ${place===10?'chục':place===100?'trăm':'nghìn'} có giá trị bao nhiêu?`,Math.floor(base/place)%10*place,`Lấy chữ số hàng đang xét nhân với ${nfmt(place)}.`,'Giá trị hàng');
      if(t===1)return exercise(`Số liền sau ${nfmt(base)} là số nào?`,base+1,`${nfmt(base)} + 1 = ${nfmt(base+1)}.`,'Dãy số');
      if(t===2)return exercise(`Số liền trước ${nfmt(base)} là số nào?`,base-1,`${nfmt(base)} − 1 = ${nfmt(base-1)}.`,'Dãy số');
      if(t===3)return exercise(`Làm tròn ${nfmt(base)} đến hàng trăm.`,Math.round(base/100)*100,`Xét hai chữ số cuối: ${base%100}; kết quả là ${nfmt(Math.round(base/100)*100)}.`,'Làm tròn');
      if(t===4)return exercise(`Số nào lớn hơn: ${nfmt(base)} hay ${nfmt(base+87)}?`,base+87,'So sánh từ hàng cao nhất; số thứ hai lớn hơn 87.','So sánh');
      if(t===5)return exercise(`Trong số ${nfmt(base)}, có bao nhiêu trăm đầy đủ?`,Math.floor(base/100),`${nfmt(base)} : 100 lấy phần nguyên được ${Math.floor(base/100)}.`,'Cấu tạo số');
      if(t===6)return exercise(`Tìm x: x − ${a*100} = ${base}.`,base+a*100,`x = ${base} + ${a*100} = ${base+a*100}.`,'Tìm thành phần');
      return exercise(`Số nhỏ hơn ${nfmt(base)} đúng ${a*10} đơn vị là số nào?`,base-a*10,`${base} − ${a*10} = ${base-a*10}.`,'So sánh');
    }
    case 'add':{
      const x=2304+n*41,y=502+n*13,z=100+n*5;
      if(t===0)return exercise(`Tính ${x} + ${y}.`,x+y,`Cộng theo từng hàng: ${x} + ${y} = ${x+y}.`,'Cộng có nhớ');
      if(t===1)return exercise(`Tính ${x+y} − ${y}.`,x,`Lấy tổng trừ số hạng đã biết: ${x+y} − ${y} = ${x}.`,'Trừ có nhớ');
      if(t===2)return exercise(`Tính ${x} + ${y} + ${z}.`,x+y+z,`Gộp ${x} + ${y} = ${x+y}; cộng ${z} được ${x+y+z}.`,'Biểu thức');
      if(t===3)return exercise(`Tính ${x+y+z} − (${y} + ${z}).`,x,`Trong ngoặc bằng ${y+z}; hiệu bằng ${x}.`,'Biểu thức có ngoặc');
      if(t===4)return exercise(`Tìm x: x + ${y} = ${x+y}.`,x,`x = ${x+y} − ${y} = ${x}.`,'Tìm x');
      if(t===5)return exercise(`Tìm x: ${x+y} − x = ${y}. x bằng bao nhiêu?`,x,`x = ${x+y} − ${y} = ${x}.`,'Tìm số trừ');
      if(t===6)return exercise(`Tính ${x} − ${z} + ${y}.`,x-z+y,`Trừ trước rồi cộng: ${x-z} + ${y} = ${x-z+y}.`,'Biểu thức');
      return exercise(`Tổng của ${x}, ${y} và ${z} là bao nhiêu?`,x+y+z,`${x} + ${y} + ${z} = ${x+y+z}.`,'Cộng ba số');
    }
    case 'multiply':{
      const x=24+n*3,y=4+n%13,z=2+n%7;
      if(t===0)return exercise(`Tính ${x} × ${y}.`,x*y,`${x} × ${y} = ${x*y}.`,'Nhân');
      if(t===1)return exercise(`Tính ${x*y} : ${y}.`,x,`Vì ${x} × ${y} = ${x*y}, thương là ${x}.`,'Chia hết');
      if(t===2)return exercise(`Tìm x: x × ${y} = ${x*y}.`,x,`x = ${x*y} : ${y} = ${x}.`,'Tìm thừa số');
      if(t===3)return exercise(`Tìm x: ${x*y} : x = ${y}. x bằng bao nhiêu?`,x,`x = ${x*y} : ${y} = ${x}.`,'Tìm số chia');
      if(t===4)return exercise(`Tính ${x} × (${y} + ${z}).`,x*(y+z),`${x} × ${y} + ${x} × ${z} = ${x*(y+z)}.`,'Phân phối');
      if(t===5)return exercise(`Tính (${x*y} + ${z*y}) : ${y}.`,x+z,`(${x} + ${z}) × ${y} : ${y} = ${x+z}.`,'Biểu thức');
      if(t===6)return exercise(`Chia ${x*y+z} cho ${y}, số dư là bao nhiêu?`,z%y,`${x*y+z} = ${Math.floor((x*y+z)/y)} × ${y} + ${z%y}.`,'Chia có dư');
      return exercise(`Tính ${x} × ${y} − ${x} × ${z}.`,x*(y-z),`Đặt ${x} làm thừa số chung: ${x} × (${y} − ${z}) = ${x*(y-z)}.`,'Phân phối');
    }
    case 'quick':{
      const x=40+n*3,y=12+n%11,z=5+n%7;
      if(t===0)return exercise(`Tính nhanh 25 + ${x} + 75.`,x+100,`(25 + 75) + ${x} = 100 + ${x} = ${x+100}.`,'Ghép số tròn trăm');
      if(t===1)return exercise(`Tính nhanh 125 + ${x} + 75.`,x+200,`(125 + 75) + ${x} = ${x+200}.`,'Ghép số tròn trăm');
      if(t===2)return exercise(`Tính nhanh ${x} × ${y} + ${x} × ${z}.`,x*(y+z),`${x} × (${y} + ${z}) = ${x*(y+z)}.`,'Phân phối');
      if(t===3)return exercise(`Tính nhanh ${x} × ${y} − ${x} × ${z}.`,x*(y-z),`${x} × (${y} − ${z}) = ${x*(y-z)}.`,'Thừa số chung');
      if(t===4)return exercise(`Tính ${x} + (${y} × ${z}).`,x+y*z,`Trong ngoặc có tích ${y*z}; cộng ${x} được ${x+y*z}.`,'Thứ tự phép tính');
      if(t===5)return exercise(`Tính (${x} + ${y}) × ${z}.`,(x+y)*z,`Tính trong ngoặc: ${x+y}; nhân với ${z} được ${(x+y)*z}.`,'Dấu ngoặc');
      if(t===6)return exercise(`Tính nhanh 4 × ${x} × 25.`,x*100,`(4 × 25) × ${x} = 100 × ${x} = ${x*100}.`,'Giao hoán kết hợp');
      return exercise(`Tính nhanh ${x} × (${y} + ${z}) − ${x} × ${y}.`,x*z,`Rút gọn còn ${x} × ${z} = ${x*z}.`,'Tính nhanh nhiều bước');
    }
    case 'fractions':{
      const denominator=5+n%9,numerator=1+n%(denominator-1),mult=2+n%4,other=(numerator% (denominator-1))+1;
      if(t===0)return exercise(`Điền tử số: ${numerator}/${denominator} = ?/${denominator*mult}.`,numerator*mult,`Nhân cả tử và mẫu với ${mult}; tử mới ${numerator*mult}.`,'Phân số bằng nhau');
      if(t===1)return exercise(`Rút gọn ${numerator*mult}/${denominator*mult} bằng cách chia cả tử và mẫu cho ${mult}. Tử số mới là bao nhiêu?`,numerator,`Tử mới = ${numerator*mult} : ${mult} = ${numerator}.`,'Rút gọn');
      if(t===2)return exercise(`Hai phân số ${numerator}/${denominator} và ${numerator+1}/${denominator}; tử số của phân số lớn hơn là bao nhiêu?`,numerator+1,'Cùng mẫu dương, so sánh tử số.','So sánh cùng mẫu');
      if(t===3)return exercise(`Tính tử số của tổng ${numerator}/${denominator} + ${other}/${denominator}.`,numerator+other,`Cùng mẫu, cộng tử: ${numerator} + ${other} = ${numerator+other}.`,'Cộng cùng mẫu');
      if(t===4)return exercise(`Tính tử số của hiệu ${numerator+other}/${denominator} − ${other}/${denominator}.`,numerator,`Cùng mẫu, trừ tử: ${numerator+other} − ${other} = ${numerator}.`,'Trừ cùng mẫu');
      if(t===5)return exercise(`Một hình chia thành ${denominator} phần bằng nhau, tô ${numerator} phần. Tử số phân số phần tô là bao nhiêu?`,numerator,'Tử số đếm phần được tô.','Nhận biết phân số');
      if(t===6)return exercise(`Tìm mẫu số: ${numerator}/${denominator} = ${numerator*mult}/?.`,denominator*mult,`Nhân mẫu ${denominator} với ${mult} được ${denominator*mult}.`,'Phân số bằng nhau');
      return exercise(`Tìm số phần chưa tô: Hình có ${denominator} phần bằng nhau, đã tô ${numerator} phần.`,denominator-numerator,`${denominator} − ${numerator} = ${denominator-numerator} phần.`,'Nhận biết phân số');
    }
    case 'geometry':{
      const x=5+n%20,y=3+n%11;
      if(t===0)return exercise(`Chu vi hình chữ nhật dài ${x} cm, rộng ${y} cm là bao nhiêu cm?`,2*(x+y),`(${x} + ${y}) × 2 = ${2*(x+y)} cm.`,'Chu vi');
      if(t===1)return exercise(`Diện tích hình chữ nhật dài ${x} cm, rộng ${y} cm là bao nhiêu cm²?`,x*y,`${x} × ${y} = ${x*y} cm².`,'Diện tích');
      if(t===2)return exercise(`Chu vi hình vuông cạnh ${x} cm là bao nhiêu cm?`,4*x,`${x} × 4 = ${4*x} cm.`,'Chu vi hình vuông');
      if(t===3)return exercise(`Diện tích hình vuông cạnh ${x} cm là bao nhiêu cm²?`,x*x,`${x} × ${x} = ${x*x} cm².`,'Diện tích hình vuông');
      if(t===4)return exercise(`Hình chữ nhật chu vi ${2*(x+y)} cm, chiều dài ${x} cm. Chiều rộng là bao nhiêu cm?`,y,`Nửa chu vi ${x+y}; trừ chiều dài ${x} được ${y} cm.`,'Tìm cạnh');
      if(t===5)return exercise(`Hình vuông chu vi ${4*x} cm, cạnh là bao nhiêu cm?`,x,`${4*x} : 4 = ${x} cm.`,'Tìm cạnh');
      if(t===6)return exercise(`Một góc ${30+n%10}° là góc nhọn (1), vuông (2) hay tù (3)?`,1,'Góc nhỏ hơn 90° là góc nhọn.','Nhận biết góc');
      return exercise(`Một góc ${100+n%25}° là góc nhọn (1), vuông (2) hay tù (3)?`,3,'Góc lớn hơn 90° và nhỏ hơn 180° là góc tù.','Nhận biết góc');
    }
    case 'units':{
      const x=3+n%80;
      if(t===0)return exercise(`Đổi ${x} m = ? cm.`,x*100,`1 m = 100 cm; ${x} × 100 = ${x*100} cm.`,'Độ dài');
      if(t===1)return exercise(`Đổi ${x} kg = ? g.`,x*1000,`1 kg = 1 000 g; ${x} × 1 000 = ${x*1000} g.`,'Khối lượng');
      if(t===2)return exercise(`Đổi ${x} km = ? m.`,x*1000,`1 km = 1 000 m; ${x} × 1 000 = ${x*1000} m.`,'Độ dài');
      if(t===3)return exercise(`Đổi ${x} giờ = ? phút.`,x*60,`1 giờ = 60 phút; ${x} × 60 = ${x*60} phút.`,'Thời gian');
      if(t===4)return exercise(`Đổi ${x} phút = ? giây.`,x*60,`1 phút = 60 giây; ${x} × 60 = ${x*60} giây.`,'Thời gian');
      if(t===5)return exercise(`Đổi ${x} m ${x%90+10} cm = ? cm.`,x*100+(x%90+10),`${x} × 100 + ${x%90+10} = ${x*100+(x%90+10)} cm.`,'Đơn vị hỗn hợp');
      if(t===6)return exercise(`Đổi ${x} kg ${x%900+30} g = ? g.`,x*1000+(x%900+30),`${x} × 1 000 + ${x%900+30} = ${x*1000+(x%900+30)} g.`,'Đơn vị hỗn hợp');
      return exercise(`Đổi ${x} ngày = ? giờ.`,x*24,`1 ngày = 24 giờ; ${x} × 24 = ${x*24} giờ.`,'Thời gian');
    }
    case 'word':{
      const x=140+n*3,y=18+n%25,z=11+n%17,num=3+n%7;
      if(t===0)return exercise(`Thư viện có ${x} quyển sách, cho mượn ${y} quyển rồi ${z} quyển. Còn bao nhiêu quyển?`,x-y-z,`${x} − (${y} + ${z}) = ${x-y-z} quyển.`,'Toán hai bước');
      if(t===1)return exercise(`Mỗi hộp có ${num} bút. Có ${y} hộp như vậy, thêm ${z} bút rời. Có tất cả bao nhiêu bút?`,num*y+z,`${num} × ${y} + ${z} = ${num*y+z} bút.`,'Nhân rồi cộng');
      if(t===2)return exercise(`Có ${num*y} chiếc bánh chia đều cho ${num} bạn. Mỗi bạn được bao nhiêu chiếc?`,y,`${num*y} : ${num} = ${y} chiếc.`,'Chia đều');
      if(t===3)return exercise(`Có ${num*y+z} quyển truyện, cho mượn ${z} quyển rồi chia đều số còn lại cho ${num} lớp. Mỗi lớp được bao nhiêu quyển?`,y,`Còn ${num*y} quyển; chia ${num} lớp được ${y} quyển/lớp.`,'Trừ rồi chia');
      if(t===4)return exercise(`Ngày đầu trồng ${y} cây, ngày sau trồng gấp ${num} lần. Cả hai ngày trồng bao nhiêu cây?`,y*(num+1),`${y} + ${y} × ${num} = ${y*(num+1)} cây.`,'Gấp một số lần');
      if(t===5)return exercise(`Ba lớp thu gom lần lượt ${x}, ${x+num*3}, ${x+num*6} kg giấy. Trung bình mỗi lớp được bao nhiêu kg?`,x+num*3,`Ba số cách đều; trung bình là số giữa: ${x+num*3} kg.`,'Trung bình cộng');
      if(t===6)return exercise(`Bình có ${x} viên bi, An có ít hơn Bình ${y} viên. Hai bạn có bao nhiêu viên?`,2*x-y,`An có ${x-y}; cả hai có ${x} + ${x-y} = ${2*x-y}.`,'Hơn kém');
      return exercise(`Mỗi ngày đọc ${num} trang trong ${y} ngày, sau đó đọc thêm ${z} trang. Tổng cộng bao nhiêu trang?`,num*y+z,`${num} × ${y} + ${z} = ${num*y+z} trang.`,'Toán hai bước');
    }
    case 'patterns':{
      const x=2+n%23,step=2+n%11;
      if(t===0)return exercise(`Tìm số tiếp theo: ${x}, ${x+step}, ${x+2*step}, ${x+3*step}, ?`,x+4*step,`Mỗi số tăng ${step}; số tiếp theo ${x+4*step}.`,'Dãy cộng');
      if(t===1)return exercise(`Tìm số tiếp theo: ${x}, ${x*2}, ${x*4}, ${x*8}, ?`,x*16,`Mỗi số gấp đôi; ${x*8} × 2 = ${x*16}.`,'Dãy nhân');
      if(t===2)return exercise(`Tìm số còn thiếu: ${x}, ${x+step}, ?, ${x+3*step}.`,x+2*step,`Số thứ ba bằng ${x} + 2 × ${step} = ${x+2*step}.`,'Điền quy luật');
      if(t===3)return exercise(`Hình thứ ${x} có ${x*3} que tính. Theo quy luật mỗi hình thêm 3 que, hình tiếp theo có mấy que?`,x*3+3,`${x*3} + 3 = ${x*3+3}.`,'Quy luật hình');
      if(t===4)return exercise(`Tổng ba số tự nhiên liên tiếp bắt đầu từ ${x} là bao nhiêu?`,x*3+3,`${x} + ${x+1} + ${x+2} = ${x*3+3}.`,'Suy luận số');
      if(t===5)return exercise(`Một dãy tăng đều ${step} đơn vị, số đầu là ${x}. Số thứ 5 là bao nhiêu?`,x+4*step,`${x} + 4 × ${step} = ${x+4*step}.`,'Vị trí dãy');
      if(t===6)return exercise(`Tìm x: ${x} + x = ${x+step}.`,step,`x = ${x+step} − ${x} = ${step}.`,'Suy luận ngược');
      return exercise(`Dãy ${x}, ${x+step}, ${x+2*step}, ... Số thứ 6 là bao nhiêu?`,x+5*step,`${x} + 5 × ${step} = ${x+5*step}.`,'Dãy cộng');
    }
    default:throw new Error('Unknown exercise group '+group);
  }
}
export const EXERCISE_BANK = Object.freeze(BANK_GROUPS.flatMap(group=>
  Array.from({length:group.count},(_,i)=>{
    const e=make(group.id,i);
    return Object.freeze({...e,id:'mk83-'+group.id+'-'+String(i+1).padStart(3,'0'),
      groupId:group.id,topic:group.topic,level:i%3===0?'Cơ bản':i%3===1?'Khá':'Nâng cao'});
  })
));
export function groupStats(history=[]){
  const rows=(Array.isArray(history)?history:[]).flatMap(h=>h.answers||[]);
  return BANK_GROUPS.map(group=>({
    ...group,done:new Set(rows.filter(a=>a?.id?.startsWith('mk83-'+group.id+'-')).map(a=>a.id)).size
  }));
}
export function chooseExercises(groupId,level='Tất cả',count=10,history=[]){
  const seen=new Set((Array.isArray(history)?history:[]).flatMap(h=>h.answers||[]).filter(a=>a?.correct).map(a=>a.id));
  const matching=EXERCISE_BANK.filter(q=>(groupId==='all'||q.groupId===groupId)&&(level==='Tất cả'||q.level===level));
  const pending=matching.filter(q=>!seen.has(q.id));
  // Repeat completed questions only when the chosen pool has been fully mastered.
  const pool=pending.length?pending:matching;
  return pool.slice(0,Math.max(1,Math.min(20,Math.floor(count)||10)));
}
