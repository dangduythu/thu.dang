# MathKid 4 Pro V8.0 Release Candidate – Android Offline

## Trạng thái
**Mã nguồn/thiết lập APK đã có, chưa có file APK và chưa nghiệm thu trên Android thật.** Nhánh này kế thừa V7.5 Preview và toàn bộ chức năng V7.0. Chỉ hợp nhất khi người dùng xác nhận.

## Đã thêm
- Dự án Expo tối giản: index.js, package.json, app.json, eas.json, .gitignore.
- Cấu hình profile `preview` xuất APK (khác AAB) bằng EAS Build.
- ProgressStorage.js: giữ khóa `mathkid4_v1_progress`, đọc lịch sử phiên bản cũ và bảo tồn trường không biết; sao lưu JSON V2, nhập cả bản V1/V2.
- Góc bố mẹ: hiển thị thống kê bản sao lưu trước khi ghi đè; tạo bản dự phòng trước khôi phục tại `mathkid4_v8_before_restore`; chia sẻ văn bản JSON qua ứng dụng của thiết bị.
- Không thêm truy cập mạng cho nội dung học và các trò chơi; `updates.enabled=false` để bản cài đặt không yêu cầu tải cập nhật OTA lúc khởi động.

## Kiểm thử bắt buộc trước khi cài
1. Tại Expo Snack, **sao lưu JSON hiện tại ra nơi khác** trước khi cập nhật. Dữ liệu Snack và dữ liệu APK là 2 vùng lưu trữ khác nhau.
2. V8 cần **5 file JS** cùng cấp: App.js, Curriculum.js, LearningEngine.js, PersonalizedPractice.js, ProgressStorage.js. Trên Snack không cần dán package.json, eas.json hoặc index.js.
3. Kiểm tra Gia sư/Ôn lỗi sai, 120 thẻ, bản đồ, Cá mập (đúng, sai, hết giờ và nước bắn), cả 4 trò ghép, điểm, lịch sử.
4. Kiểm tra xuất JSON V2, khôi phục V1/V2, xác nhận thống kê trước khi ghi đè, nạp bản dự phòng.
5. Kiểm thử APK: cài, nhập JSON đã xuất từ Snack, tắt Wi-Fi/dữ liệu di động, buộc đóng/mở lại và thực hiện 1 lượt học; bật lại mạng để kiểm tra chia sẻ khi cần.

## Tạo APK bằng EAS Build
Máy có Node.js và quyền chạy lệnh:
```sh
npm install
npx expo install --fix
npm run check
npm test
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build:configure -p android
npx eas-cli@latest build -p android --profile preview
```
EAS sẽ yêu cầu kết nối dự án Expo và cấp/cấu hình Android signing credentials. Tải APK từ trang kết quả EAS sau khi build hoàn tất. Không dùng `eas build -p android` mặc định nếu cần APK, vì mặc định profile production thường tạo AAB.

**Máy công ty không cho cài Node.js:** dùng một máy cá nhân cho các lệnh hoặc một quy trình EAS/GitHub Actions được tài khoản Expo của người dùng cấp quyền. Chưa tích hợp Expo project ID/token vào GitHub; không đưa token vào file công khai.

## Giới hạn và lưu ý dữ liệu
- Chưa xác nhận build thực tế với EAS hoặc vận hành offline trên điện thoại.
- AsyncStorage không mã hóa; tránh nhập dữ liệu nhạy cảm; không chia sẻ JSON học tập công khai.
- app.json dùng Android package `com.dangduythu.mathkid4pro` mới. Nếu đã từng có APK MathKid với applicationId khác, không thể tự nâng cấp tại chỗ bằng package mới. Khi dùng cùng package cần giữ chữ ký APK cũ.
- Xóa dữ liệu hay gỡ APK có thể mất tiến độ cục bộ. Hãy xuất JSON và nhập vào APK sau khi cài; **không giả định dữ liệu trên Snack tự chuyển sang APK**.
- Thư viện và phiên bản được đặt cho Expo SDK 54; `expo install --fix` kiểm tra tương thích tại môi trường cài đặt.
