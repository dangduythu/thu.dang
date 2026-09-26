# MathKid 4 Pro – Kế hoạch C / V7.0 Preview

## Phạm vi đã triển khai trên nhánh thử nghiệm
- Giữ nguyên App.js và Curriculum.js V6.5; không thay thế bằng phiên bản rút gọn.
- LearningEngine.js: 30 mẫu kiểm tra theo từng mạch kiến thức × 4 biến thể hoạt động = 120 câu riêng gắn mã MK4-001…MK4-120.
- Màn thẻ học: làm câu kiểm tra, xem giải thích và thử lại; câu đúng được lưu trong lessonsDone và lessonChecks. Bài luyện theo chủ đề vẫn còn nguyên.
- Gia sư offline: phân tích tối đa 20 câu gần đây mỗi chủ đề trong tối đa 120 câu gần đây; khi dưới 5 câu thì ghi rõ chưa đủ dữ liệu; đề xuất cấp độ và nút luyện.
- Bản đồ có đường đi SVG và 5 mốc; giữ lại các thẻ ải, khóa và sao cũ.
- Khóa AsyncStorage vẫn là mathkid4_v1_progress. Các trường history, seen, stars, badges, stages, lessonsDone, currentLesson và book vẫn được giữ. Bổ sung trường lessonChecks. Sao lưu và khôi phục JSON bao gồm trường mới.
- Có bài kiểm tra logic tests/learning-engine.test.mjs; không đụng đến luồng cá mập, nước bắn, ghép Toán, tô phân số, đề kiểm tra và góc bố mẹ.

## Chưa phải tính năng hoàn tất
- Đây là **bản Preview cần kiểm thử trên Expo Snack/Android**, chưa merge vào main, chưa phải APK.
- 120 câu kiểm tra là các câu số học tĩnh được biên soạn theo mạch và biến thể, không phải ngân hàng đề vô hạn cho từng thẻ; không phải nội dung SGK được thẩm định.
- Hoạt cảnh cá mập và kéo thả được giữ nguyên V6.5, chưa thay bằng sprite animation mới. Bản đồ mới chỉ bổ sung đồ họa đường đi, chưa có nhân vật di chuyển.
- Gia sư là thuật toán quy tắc offline, không phải chatbot AI, không đánh giá năng lực từ dữ liệu ít.
- Chưa kiểm thử nhập/khôi phục trên máy Android thật hoặc tạo APK.

## Kế hoạch kỹ thuật
1. **V6.6 – Nội dung:** rà soát 120 thẻ, thêm câu hỏi đa dạng theo từng kỹ năng, đáp án/lời giải và kiểm thử học thuật. Tiêu chí: 120/120 có ít nhất một câu đúng, bài sai có giải thích.
2. **V7.0 – Thám hiểm:** asset hoạt cảnh nhiều lớp, trạng thái cá mập/thuyền/nước bắn; đường đi + nhân vật chuyển mốc; kéo thả tương thích web/Android. Tiêu chí: không mất bất kỳ trò nào từ V6.5.
3. **V7.5 – Cá nhân hóa:** theo dõi nhóm lỗi sai, tiến độ theo mạch, phiên ôn tập dựa vào dữ liệu đủ lớn; không suy đoán nếu mẫu ít.
4. **Kiểm thử/Phát hành:** chạy Snack Web + Android, kiểm tra màn nhỏ/nút cố định, bàn phím, offline sau đóng gói, sao lưu/khôi phục và build APK.

## Cài nhánh thử nghiệm trên Expo Snack
1. Sao lưu App.js và dữ liệu hiện tại; không xóa dự án đã dùng.
2. Mở nhánh feature/v7-learning-adventure-preview trên GitHub. Tạo LearningEngine.js ở gốc Snack và sao chép nội dung.
3. Thay App.js bằng file cùng nhánh. Giữ Curriculum.js V6.5 nguyên vẹn.
4. Giữ thư viện react-native-svg và @react-native-async-storage/async-storage.
5. Kiểm tra theo thứ tự: trang chủ → Thám hiểm (5 ải) → 120 thẻ → trả lời đúng/sai → Gia sư offline → Cá mập (đợi hết giờ/nước bắn) → 4 trò ghép → điểm/lịch sử → sao lưu/khôi phục.
6. Chỉ merge khi đã xác nhận trên thiết bị thật.
