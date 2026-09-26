// MathKid V6.5: 120 thẻ học được tổ chức từ 30 mạch kiến thức x 4 hoạt động.
// Tài liệu kiến thức chung, không nhận là bản sao hay ma trận chính thức của ba bộ SGK.
const BASE = [
 ['numbers','Đọc số có nhiều chữ số','Tách số thành từng lớp ba chữ số từ phải sang trái.','345 612 đọc là ba trăm bốn mươi lăm nghìn sáu trăm mười hai.'],
 ['numbers','Hàng và lớp','Giá trị chữ số bằng chữ số nhân với giá trị hàng.','Trong 62 405, chữ số 2 có giá trị 2 000.'],
 ['numbers','Phân tích cấu tạo số','Viết số thành tổng giá trị của từng chữ số khác 0.','30 406 = 30 000 + 400 + 6.'],
 ['numbers','So sánh số tự nhiên','So sánh số chữ số, rồi so sánh lần lượt từ trái sang phải.','56 210 > 56 120 vì 2 trăm > 1 trăm.'],
 ['numbers','Làm tròn số','Nhìn chữ số ngay bên phải hàng cần làm tròn; từ 5 tăng một đơn vị hàng.','4 768 làm tròn đến hàng trăm được 4 800.'],
 ['numbers','Dãy số tự nhiên','Hai số tự nhiên liên tiếp hơn kém nhau 1 đơn vị.','Số liền trước 10 000 là 9 999.'],
 ['add','Cộng số nhiều chữ số','Đặt thẳng hàng, cộng từ hàng đơn vị và nhớ khi cần.','2 475 + 1 368 = 3 843.'],
 ['add','Trừ số nhiều chữ số','Đặt thẳng hàng, trừ từ phải sang trái và mượn khi cần.','5 004 − 1 276 = 3 728.'],
 ['add','Tính chất giao hoán và kết hợp','Đổi chỗ hoặc nhóm các số hạng giúp tính thuận tiện.','25 + 67 + 75 = (25 + 75) + 67 = 167.'],
 ['add','Tìm thành phần chưa biết','Dùng phép tính ngược để tìm số hạng hoặc số bị trừ chưa biết.','x + 28 = 70 thì x = 70 − 28 = 42.'],
 ['multiply','Bảng nhân và nhân nhẩm','Tách số thành phần dễ nhân rồi cộng các tích.','12 × 5 = 10 × 5 + 2 × 5 = 60.'],
 ['multiply','Nhân với 10, 100, 1000','Nhân số tự nhiên với 10, 100, 1000 bằng cách thêm chữ số 0 tương ứng.','37 × 100 = 3 700.'],
 ['multiply','Nhân với số có hai chữ số','Nhân với hàng đơn vị, hàng chục rồi cộng tích riêng.','125 × 24 = 500 + 2 500 = 3 000.'],
 ['multiply','Tính chất phân phối','a × (b + c) = a × b + a × c.','25 × 12 = 25 × 10 + 25 × 2 = 300.'],
 ['divide','Chia hết','Kiểm tra thương bằng cách nhân thương với số chia.','936 : 12 = 78 vì 78 × 12 = 936.'],
 ['divide','Chia có dư','Số dư phải nhỏ hơn số chia.','29 : 4 = 7 dư 1.'],
 ['divide','Chia cho 10, 100, 1000','Nếu số có đủ chữ số 0 ở cuối thì bỏ số 0 tương ứng khi chia.','3 700 : 100 = 37.'],
 ['fractions','Nhận biết phân số','Mẫu số cho biết số phần bằng nhau, tử số cho biết số phần lấy.','3/4 nghĩa là lấy ba trong bốn phần bằng nhau.'],
 ['fractions','Phân số bằng nhau','Nhân hoặc chia cả tử và mẫu với cùng một số khác 0.','2/3 = 4/6.'],
 ['fractions','Rút gọn phân số','Chia tử và mẫu cho một ước chung lớn hơn 1.','6/8 = 3/4.'],
 ['fractions','So sánh phân số','Cùng mẫu dương, tử lớn hơn thì phân số lớn hơn.','5/8 > 3/8.'],
 ['geometry','Góc nhọn, góc vuông, góc tù','Nhận biết góc qua độ mở so với góc vuông.','Góc 60° nhọn; 90° vuông; 120° tù.'],
 ['geometry','Chu vi hình chữ nhật','Chu vi bằng hai lần tổng chiều dài và chiều rộng.','(12 + 7) × 2 = 38 cm.'],
 ['geometry','Diện tích hình chữ nhật','Lấy chiều dài nhân chiều rộng sau khi đổi cùng đơn vị.','12 × 7 = 84 cm².'],
 ['geometry','Hình vuông và diện tích','Bốn cạnh bằng nhau; diện tích bằng cạnh nhân cạnh.','Cạnh 9 cm có diện tích 81 cm².'],
 ['units','Đổi đơn vị độ dài','1 km = 1 000 m; 1 m = 100 cm.','4 m = 400 cm.'],
 ['units','Đổi đơn vị khối lượng','1 tấn = 1 000 kg; 1 kg = 1 000 g.','3 kg = 3 000 g.'],
 ['units','Đơn vị thời gian','1 giờ = 60 phút; 1 phút = 60 giây.','2 giờ 15 phút = 135 phút.'],
 ['word','Toán có lời văn nhiều bước','Ghi dữ kiện, tìm kết quả trung gian rồi trả lời câu hỏi.','200 − (35 + 27) = 138.'],
 ['word','Trung bình cộng','Lấy tổng các số chia cho số lượng số hạng.','(12 + 15 + 18) : 3 = 15.'],
];
const STAGES = [
 ['Khám phá','Đọc quy tắc và nhận biết ví dụ.','Con hãy chỉ ra dữ kiện đã cho và điều cần tìm.'],
 ['Ví dụ có hướng dẫn','Giải thích vì sao phép tính hoặc quy tắc được áp dụng.','Con hãy tự thực hiện lại ví dụ trên giấy.'],
 ['Vận dụng','Đưa quy tắc vào bài toán có số liệu thay đổi.','Con hãy thử đổi số liệu trong ví dụ rồi tính lại.'],
 ['Thử thách','Kiểm tra ngược kết quả hoặc tìm cách giải khác.','Con hãy giải thích vì sao đáp án hợp lý.'],
];
export const CURRICULUM = BASE.flatMap(([topic,title,rule,example],baseIndex)=>
 STAGES.map(([stage,goal,activity],stageIndex)=>({
   id:`MK4-${String(baseIndex*4+stageIndex+1).padStart(3,'0')}`, topic,
   title:`${title} · ${stage}`, rule, example, goal, activity,
   stage:stageIndex, number:baseIndex*4+stageIndex+1
 }))
);
export const curriculumFor = topic=>CURRICULUM.filter(l=>l.topic===topic);
export const getLesson = id=>CURRICULUM.find(l=>l.id===id);
export const getNextLesson = (done=[])=>CURRICULUM.find(l=>!done.includes(l.id))||CURRICULUM[0];
// Chỉ sắp xếp chủ đề tham khảo; chưa đối chiếu chương/bài với từng sách.
export const BOOK_TOPIC_ORDER={
 general:['numbers','add','multiply','divide','fractions','geometry','units','word'],
 kntt:['numbers','add','multiply','divide','geometry','units','fractions','word'],
 ctst:['numbers','add','multiply','divide','units','geometry','fractions','word'],
 cd:['numbers','add','multiply','divide','geometry','units','fractions','word'],
};