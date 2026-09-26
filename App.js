import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Easing, Keyboard, KeyboardAvoidingView, PanResponder, Platform, Pressable, SafeAreaView,
  ScrollView, Share, StatusBar, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CURRICULUM, curriculumFor, getLesson, getNextLesson, BOOK_TOPIC_ORDER} from './Curriculum';
import {makeLessonCheck, evaluateLearning, recommendLearning} from './LearningEngine';
import {recentMistakes, topicTrends, dailyReviewPlan} from './PersonalizedPractice';
import {PROGRESS_KEY, PRE_RESTORE_KEY, normalizeProgress, makeBackup, parseBackup, progressSummary} from './ProgressStorage';

const SAVE_KEY = PROGRESS_KEY; // Giữ chính xác khóa V5–V7.5 để đọc lịch sử cũ.
const BOOKS = [
  {id:'general', name:'Kiến thức chung lớp 4'},
  {id:'kntt', name:'Kết nối tri thức với cuộc sống'},
  {id:'ctst', name:'Chân trời sáng tạo'},
  {id:'cd', name:'Cánh Diều'},
];
// Bản alpha: lựa chọn bộ sách là tùy chọn hồ sơ, CHƯA phải ma trận đề được duyệt theo SGK.

const GREEN = '#168451';
const APP_VERSION = 'V8.0 RC · Android Offline';
const TOPICS = [
  { id: 'numbers', title: 'Số tự nhiên', icon: '🔢', color: '#e6f4ea', description: 'Hàng, lớp, so sánh và làm tròn số', lessons: [
    ['Hàng và lớp', 'Trong số 36 425, chữ số 6 ở hàng nghìn nên có giá trị 6 000.', '36 425 = 30 000 + 6 000 + 400 + 20 + 5.'],
    ['So sánh số', 'Số có nhiều chữ số hơn thì lớn hơn. Nếu bằng số chữ số, so sánh từ trái sang phải.', '45 210 > 45 120 vì ở hàng trăm: 2 > 1.'],
    ['Làm tròn số', 'Để làm tròn đến hàng trăm, xem chữ số hàng chục: từ 5 trở lên thì tăng hàng trăm lên 1.', '3 468 làm tròn đến hàng trăm được 3 500.'],
  ] },
  { id: 'add', title: 'Cộng và trừ', icon: '➕', color: '#eaf1ff', description: 'Đặt tính, tính nhẩm và toán có lời văn', lessons: [
    ['Phép cộng', 'Cộng các chữ số cùng hàng từ phải sang trái, nhớ sang hàng tiếp theo khi cần.', '2 475 + 1 368 = 3 843.'],
    ['Phép trừ', 'Trừ các chữ số cùng hàng từ phải sang trái; khi thiếu thì mượn ở hàng bên trái.', '5 004 − 1 276 = 3 728.'],
  ] },
  { id: 'multiply', title: 'Phép nhân', icon: '✖️', color: '#fff3dc', description: 'Nhân số có nhiều chữ số và tính nhanh', lessons: [
    ['Nhân với số có hai chữ số', 'Nhân lần lượt với hàng đơn vị và hàng chục, sau đó cộng các tích riêng.', '125 × 24 = 125 × 4 + 125 × 20 = 3 000.'],
    ['Tính chất phân phối', 'a × (b + c) = a × b + a × c.', '25 × 12 = 25 × (10 + 2) = 300.'],
  ] },
  { id: 'divide', title: 'Phép chia', icon: '➗', color: '#f1eafa', description: 'Chia hết, chia có dư và kiểm tra kết quả', lessons: [
    ['Chia hết', 'Thương nhân với số chia phải bằng số bị chia.', '936 : 12 = 78 vì 78 × 12 = 936.'],
    ['Chia có dư', 'Số dư luôn nhỏ hơn số chia.', '29 : 4 = 7 (dư 1) vì 4 × 7 + 1 = 29.'],
  ] },
  { id: 'fractions', title: 'Phân số', icon: '🍰', color: '#ffedf3', description: 'Nhận biết, rút gọn, so sánh phân số', lessons: [
    ['Phân số bằng nhau', 'Nhân hoặc chia cả tử và mẫu cho cùng một số khác 0 thì được phân số bằng nó.', '2/3 = 4/6 vì nhân cả tử và mẫu với 2.'],
    ['Rút gọn phân số', 'Chia tử số và mẫu số cho cùng một ước chung lớn hơn 1.', '6/8 = 3/4 vì cùng chia cho 2.'],
    ['So sánh phân số cùng mẫu', 'Cùng mẫu số dương, phân số có tử lớn hơn thì lớn hơn.', '5/8 > 3/8.'],
  ] },
  { id: 'geometry', title: 'Hình học', icon: '📐', color: '#e9f5fe', description: 'Chu vi, diện tích hình vuông và chữ nhật', lessons: [
    ['Chu vi hình chữ nhật', 'Chu vi = (chiều dài + chiều rộng) × 2.', '(12 + 7) × 2 = 38 cm.'],
    ['Diện tích hình chữ nhật', 'Diện tích = chiều dài × chiều rộng, cùng đơn vị đo.', '12 × 7 = 84 cm².'],
    ['Diện tích hình vuông', 'Diện tích = cạnh × cạnh.', 'Cạnh 9 cm thì diện tích 81 cm².'],
  ] },
  { id: 'units', title: 'Đại lượng', icon: '⚖️', color: '#fff6dc', description: 'Đổi đơn vị độ dài và khối lượng', lessons: [
    ['Đơn vị độ dài', '1 m = 100 cm, 1 km = 1000 m.', '4 m = 400 cm.'],
    ['Đơn vị khối lượng', '1 kg = 1000 g, 1 tấn = 1000 kg.', '3 kg = 3000 g.'],
  ] },
  { id: 'word', title: 'Toán có lời văn', icon: '🛒', color: '#edf3ff', description: 'Tính tổng, hiệu và số còn lại', lessons: [
    ['Toán hai bước', 'Đọc dữ kiện, xác định điều cần tìm và viết phép tính theo từng bước.', 'Có 200 quả, bán 35 và 27 quả: còn 200 − (35 + 27) = 138 quả.'],
    ['Trung bình cộng', 'Tổng các số chia cho số lượng số.', 'Trung bình của 12, 15, 18 là (12 + 15 + 18) : 3 = 15.'],
  ] },
  { id: 'patterns', title: 'Toán tư duy', icon: '🧠', color: '#f1e9ff', description: 'Tìm quy luật và suy luận', lessons: [
    ['Dãy số cách đều', 'Tìm hiệu giữa hai số liên tiếp rồi áp dụng cho số tiếp theo.', '3, 7, 11, 15, ...; số tiếp theo là 19.'],
    ['Tìm số chưa biết', 'Quan sát quan hệ giữa các phép tính và thử kiểm tra ngược.', 'Nếu □ × 6 = 72 thì □ = 72 : 6 = 12.'],
  ] },
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const formatNum = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const normalize = (s) => String(s).replace(/[\s.,]/g, '').trim();
const emptyProgress = () => ({ history: [], seen: [], stars: 0, badges: [], stages: {}, lessonsDone: [], currentLesson: null, lessonChecks: {} });
const WORLDS = [{id:'numbers',name:'Rừng Số Học',icon:'🌳'},{id:'fractions',name:'Đảo Phân Số',icon:'🏝️'},{id:'geometry',name:'Thành Phố Hình Học',icon:'🏙️'},{id:'patterns',name:'Núi Trí Tuệ',icon:'⛰️'},{id:'word',name:'Lâu Đài Toán Học',icon:'🏰'}];
const EXAM_TOPICS = ['numbers','add','multiply','divide','fractions','geometry','units','word','patterns'];
const gcd = (a,b) => b ? gcd(b,a%b) : a;
const topicStats = (history, id) => { const rows=history.flatMap(h=>h.answers||[]).filter(a=>a.topic===id); return {total:rows.length,correct:rows.filter(a=>a.correct).length}; };
const recommendedLevel = (history,id) => {const r=topicStats(history,id); const pct=r.total?r.correct/r.total:0.75; return r.total<5?'Khá':pct<.6?'Cơ bản':pct>=.88?'Nâng cao':'Khá';};

// Each generator returns a mathematically consistent question, answer and worked solution.
function buildQuestion(topic, level) {
  let a, b, answer, question, explanation, signature, visual = null;
  const max = level === 'Cơ bản' ? 99 : level === 'Khá' ? 999 : 9999;
  switch (topic) {
    case 'numbers': {
      const kind = randomInt(0, 2);
      a = randomInt(level === 'Cơ bản' ? 100 : 1000, level === 'Nâng cao' ? 999999 : 99999);
      if (kind === 0) {
        const place = [10, 100, 1000][randomInt(0, level === 'Cơ bản' ? 1 : 2)];
        answer = Math.floor(a / place) % 10 * place;
        question = `Trong số ${formatNum(a)}, chữ số hàng ${place === 10 ? 'chục' : place === 100 ? 'trăm' : 'nghìn'} có giá trị bao nhiêu?`;
        explanation = `Chữ số ở hàng này là ${Math.floor(a / place) % 10}. Giá trị của nó là ${Math.floor(a / place) % 10} × ${formatNum(place)} = ${formatNum(answer)}.`;
        signature = `n-place-${a}-${place}`;
      } else if (kind === 1) {
        b = a + randomInt(1, 99);
        answer = b;
        question = `Số nào lớn hơn: ${formatNum(a)} hay ${formatNum(b)}?`;
        explanation = `So sánh từ hàng cao nhất. ${formatNum(b)} lớn hơn ${formatNum(a)}.`;
        signature = `n-compare-${a}-${b}`;
      } else {
        const place = level === 'Cơ bản' ? 10 : [10, 100, 1000][randomInt(0, 2)];
        answer = Math.round(a / place) * place;
        question = `Làm tròn số ${formatNum(a)} đến hàng ${place === 10 ? 'chục' : place === 100 ? 'trăm' : 'nghìn'}.`;
        explanation = `Xem chữ số ngay bên phải hàng cần làm tròn; từ 5 trở lên thì tăng 1, còn lại giữ nguyên. Kết quả là ${formatNum(answer)}.`;
        signature = `n-round-${a}-${place}`;
      }
      break;
    }
    case 'add': {
      a = randomInt(20, max); b = randomInt(10, max);
      const minus = randomInt(0, 1) === 1;
      if (minus && b > a) [a, b] = [b, a];
      answer = minus ? a - b : a + b;
      question = `${formatNum(a)} ${minus ? '−' : '+'} ${formatNum(b)} = ?`;
      explanation = minus ? `Đặt tính thẳng hàng. Lấy ${formatNum(a)} trừ ${formatNum(b)}, được ${formatNum(answer)}.` : `Đặt tính thẳng hàng. Cộng từ hàng đơn vị sang trái, được ${formatNum(answer)}.`;
      signature = `a-${minus ? 'sub' : 'sum'}-${a}-${b}`;
      break;
    }
    case 'multiply': {
      a = randomInt(level === 'Cơ bản' ? 2 : 12, level === 'Nâng cao' ? 999 : level === 'Khá' ? 199 : 20);
      b = randomInt(2, level === 'Nâng cao' ? 99 : level === 'Khá' ? 39 : 10);
      answer = a * b;
      question = `${formatNum(a)} × ${formatNum(b)} = ?`;
      const tens = Math.floor(b / 10) * 10, ones = b % 10;
      explanation = b >= 10 ? `Tách ${b} = ${tens} + ${ones}. Ta có ${formatNum(a)} × ${tens} + ${formatNum(a)} × ${ones} = ${formatNum(a * tens)} + ${formatNum(a * ones)} = ${formatNum(answer)}.` : `${formatNum(a)} được lấy ${b} lần; tích là ${formatNum(answer)}.`;
      signature = `m-${a}-${b}`;
      break;
    }
    case 'divide': {
      b = randomInt(2, level === 'Nâng cao' ? 49 : level === 'Khá' ? 25 : 10);
      answer = randomInt(2, level === 'Nâng cao' ? 199 : level === 'Khá' ? 99 : 20);
      a = b * answer;
      question = `${formatNum(a)} : ${formatNum(b)} = ?`;
      explanation = `Kiểm tra bằng phép nhân: ${formatNum(b)} × ${formatNum(answer)} = ${formatNum(a)}. Vậy thương là ${formatNum(answer)}.`;
      signature = `d-${a}-${b}`;
      break;
    }
    case 'fractions': {
      const kind = randomInt(0, 2);
      b = randomInt(3, level === 'Nâng cao' ? 12 : 9);
      a = randomInt(1, b - 1);
      if (kind === 0) {
        const k = randomInt(2, 5);
        answer = a * k;
        question = `Điền tử số: ${a}/${b} = ?/${b * k}`;
        explanation = `Nhân cả tử và mẫu với ${k}: ${a} × ${k} = ${answer}, ${b} × ${k} = ${b*k}.`;
        visual = {type:'fraction',numerator:a,denominator:b};
        signature = `f-eq-${a}-${b}-${k}`;
      } else if (kind === 1) {
        const k = randomInt(2, 6);
        const g = gcd(a,b);
        a = a/g; b = b/g;
        answer = a;
        question = `Rút gọn ${a*k}/${b*k}: tử số sau khi chia cả tử và mẫu cho ${k} là bao nhiêu?`;
        explanation = `${a*k} : ${k} = ${a}; ${b*k} : ${k} = ${b}. Phân số sau khi rút gọn là ${a}/${b}.`;
        visual = {type:'fraction',numerator:a*k,denominator:b*k};
        signature = `f-reduce-${a}-${b}-${k}`;
      } else {
        let c = randomInt(1, b-1);
        if (c === a) c = c === b - 1 ? 1 : c + 1;
        answer = Math.max(a,c);
        question = `Hai phân số ${a}/${b} và ${c}/${b}: tử số của phân số lớn hơn là bao nhiêu?`;
        explanation = `Cùng mẫu ${b}, so sánh tử số ${a} và ${c}. Tử số lớn hơn là ${answer}.`;
        visual = {type:'fraction',numerator:a,denominator:b,compareNumerator:c};
        signature = `f-compare-${a}-${b}-${c}`;
      }
      break;
    }
    case 'geometry': {
      a = randomInt(3, level === 'Nâng cao' ? 45 : 20);
      b = randomInt(2, a);
      const kind = randomInt(0,2);
      if (kind === 0) {
        answer = 2*(a+b);
        question = `Hình chữ nhật dài ${a} cm, rộng ${b} cm. Chu vi bao nhiêu cm?`;
        explanation = `Chu vi = (${a} + ${b}) × 2 = ${answer} cm.`;
      } else if (kind === 1) {
        answer = a*b;
        question = `Hình chữ nhật dài ${a} cm, rộng ${b} cm. Diện tích bao nhiêu cm²?`;
        explanation = `Diện tích = ${a} × ${b} = ${answer} cm².`;
      } else {
        answer = a*a;
        question = `Hình vuông cạnh ${a} cm. Diện tích bao nhiêu cm²?`;
        explanation = `Diện tích = ${a} × ${a} = ${answer} cm².`;
      }
      visual = {type:'geometry',kind,length:a,width:kind===2?a:b,unit:'cm'};
      signature = `g-${kind}-${a}-${b}`;
      break;
    }
    case 'units': {
      a = randomInt(2, level === 'Nâng cao' ? 250 : 30);
      const kind = randomInt(0,2);
      const label = ['m sang cm','kg sang g','km sang m'][kind];
      answer = a * (kind === 0 ? 100 : 1000);
      question = `Đổi ${a} ${['m','kg','km'][kind]} = ? ${['cm','g','m'][kind]}`;
      explanation = `1 ${['m','kg','km'][kind]} = ${kind===0?'100':'1 000'} ${['cm','g','m'][kind]}, nên ${a} × ${kind===0?'100':'1 000'} = ${formatNum(answer)}.`;
      visual = {type:'units',kind,amount:a};
      signature = `u-${label}-${a}`;
      break;
    }
    case 'word': {
      a = randomInt(120, level === 'Nâng cao' ? 1500 : 600);
      b = randomInt(10, Math.floor(a/4));
      const c = randomInt(10, Math.floor(a/4));
      answer = a-b-c;
      question = `Cửa hàng có ${a} quyển vở, sáng bán ${b} quyển, chiều bán ${c} quyển. Còn lại bao nhiêu quyển?`;
      explanation = `Đã bán ${b} + ${c} = ${b+c} quyển. Còn lại ${a} − ${b+c} = ${answer} quyển.`;
      signature = `w-${a}-${b}-${c}`;
      break;
    }
    case 'patterns': {
      a = randomInt(1, level==='Nâng cao'?100:30);
      b = randomInt(2, level==='Nâng cao'?30:12);
      answer = a+4*b;
      question = `Tìm số tiếp theo: ${a}, ${a+b}, ${a+2*b}, ${a+3*b}, ?`;
      explanation = `Mỗi số tăng ${b}. Số tiếp theo = ${a+3*b} + ${b} = ${answer}.`;
      signature = `p-${a}-${b}`;
      break;
    }
    default: return buildQuestion('add', level);
  }
  return { id: signature, topic, level, question, answer, explanation, visual };
}

function createSet(topic, level, count, oldSeen) {
  const seen = new Set(oldSeen);
  const result = [];
  for (let i = 0; i < count; i++) {
    let q; let attempts = 0;
    do { q = buildQuestion(topic, level); attempts++; } while (seen.has(q.id) && attempts < 300);
    if (seen.has(q.id)) break;
    seen.add(q.id);
    result.push(q);
  }
  return { questions: result, seen: Array.from(seen) };
}

function Button({ children, onPress, secondary, disabled, small }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.buttonSecondary, disabled && { opacity: 0.45 }, small && { paddingVertical: 10 }]}><Text style={[styles.buttonText, secondary && { color: GREEN }]}>{children}</Text></Pressable>;
}
function Tile({ title, subtitle, icon, onPress, color }) {
  return <Pressable onPress={onPress} style={[styles.tile, { backgroundColor: color || '#f1f5f9' }]}><Text style={styles.tileIcon}>{icon}</Text><Text style={styles.tileTitle}>{title}</Text><Text style={styles.tileSub}>{subtitle}</Text></Pressable>;
}

// V6.1.1: tranh vector nhiều lớp. Cá mập hướng sang PHẢI: đầu + hàm tại x=143, đuôi tại x=13.
function OceanBackdrop() {
  return <Svg width="100%" height="100%" viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice">
    <Defs>
      <LinearGradient id="sky611" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#4BA9EC"/><Stop offset=".68" stopColor="#ACE6F8"/><Stop offset="1" stopColor="#F3E4B1"/></LinearGradient>
      <LinearGradient id="water611" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#34BFCF"/><Stop offset=".50" stopColor="#098DB5"/><Stop offset="1" stopColor="#075279"/></LinearGradient>
      <LinearGradient id="island611" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#68D69B"/><Stop offset="1" stopColor="#187E75"/></LinearGradient>
    </Defs>
    <Rect width="360" height="240" fill="url(#sky611)"/>
    <Circle cx="288" cy="47" r="25" fill="#FFF5B4" opacity=".6"/><Circle cx="288" cy="47" r="18" fill="#FFE29A"/>
    <G fill="#FFF" opacity=".87"><Ellipse cx="50" cy="45" rx="26" ry="9"/><Circle cx="40" cy="38" r="12"/><Circle cx="59" cy="38" r="10"/><Ellipse cx="198" cy="30" rx="26" ry="7"/><Circle cx="190" cy="24" r="10"/></G>
    <Path d="M0 130 Q42 103 80 131 L113 123 L151 139 L0 146Z" fill="#7ACBB6" opacity=".72"/>
    <Path d="M215 141 Q249 105 279 130 Q323 99 360 131 L360 157Z" fill="url(#island611)"/>
    <Path d="M255 130 L277 88 L301 130Z" fill="#329A84"/><Path d="M297 127 L320 97 L343 132Z" fill="#25836F"/>
    <Path d="M0 150 Q64 139 115 148 Q181 135 241 149 Q310 139 360 150 L360 240 L0 240 Z" fill="url(#water611)"/>
    <Path d="M0 163 Q42 151 91 161 T183 160 T274 163 T360 160" fill="none" stroke="#9CEBF0" strokeWidth="3" opacity=".7"/>
    <Path d="M0 206 Q60 192 120 205 T240 206 T360 201" fill="none" stroke="#006B99" strokeWidth="10" opacity=".22"/>
    <G fill="none" stroke="#E6FDFF" strokeWidth="2.5" opacity=".7" strokeLinecap="round"><Path d="M17 176 Q31 171 47 176"/><Path d="M130 166 Q146 162 160 166"/><Path d="M275 184 Q292 179 311 183"/><Path d="M49 221 Q66 216 87 222"/><Path d="M178 226 Q199 220 219 224"/></G>
  </Svg>;
}
function BoatArt({ danger=false, winning=false }) {
  return <Svg width="174" height="125" viewBox="0 0 174 125">
    <Defs><LinearGradient id="hull611" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#ECA74B"/><Stop offset=".45" stopColor="#B66531"/><Stop offset="1" stopColor="#793D2A"/></LinearGradient></Defs>
    <Ellipse cx="88" cy="111" rx="77" ry="7" fill="#084965" opacity=".20"/>
    <Path d="M8 87 Q75 95 163 85 L144 107 Q82 121 33 105Z" fill="url(#hull611)" stroke="#793E22" strokeWidth="2"/>
    <Path d="M11 86 Q90 92 164 85 L156 92 Q85 103 20 94Z" fill="#F2B35D"/>
    <Path d="M32 102 Q88 114 143 101" stroke="#FFD88E" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <Path d="M113 87 L113 30" stroke="#66442E" strokeWidth="4"/>
    <Path d="M118 34 L151 72 Q128 72 118 69Z" fill="#FFF1B7" stroke="#D5AC65" strokeWidth="1.5"/>
    <Path d="M113 36 L113 72 L95 72Z" fill="#F6C86C"/>
    <Path d="M61 86 L62 65 Q66 52 81 53 Q94 54 100 72 L99 88Z" fill="#55AE70" stroke="#267454" strokeWidth="1.5"/>
    <Path d="M70 66 Q58 70 54 77" stroke="#ECA773" strokeWidth="7" fill="none" strokeLinecap="round"/>
    <Path d="M91 66 Q102 66 107 78" stroke="#ECA773" strokeWidth="7" fill="none" strokeLinecap="round"/>
    <Path d="M68 46 Q61 26 72 21 Q83 13 95 24 Q102 40 92 50 Q78 57 68 46Z" fill="#F6BB8D" stroke="#9B6044" strokeWidth="1.5"/>
    <Path d="M63 28 L69 17 Q84 9 96 21 L102 32Z" fill="#D8AD5A" stroke="#9C7236" strokeWidth="1.6"/>
    <Path d="M57 30 Q80 23 105 30 L108 35 Q82 41 56 35Z" fill="#F7D281" stroke="#AD8242" strokeWidth="1.5"/>
    <Path d="M71 21 Q82 16 94 22" fill="none" stroke="#99703C" strokeWidth="2"/>
    <Path d="M72 37 L77 35 M87 35 L92 37" stroke="#543F36" strokeWidth="1.8" strokeLinecap="round"/>
    {danger?<><Circle cx="76" cy="40" r="2.2" fill="#243E3D"/><Circle cx="90" cy="40" r="2.2" fill="#243E3D"/><Ellipse cx="83" cy="48" rx="3" ry="4" fill="#8D514A"/></>:winning?<><Path d="M74 40 Q77 36 80 40 M86 40 Q90 36 93 40" fill="none" stroke="#243E3D" strokeWidth="2"/><Path d="M75 45 Q83 55 92 45" fill="none" stroke="#934B37" strokeWidth="2"/></>:<><Circle cx="77" cy="40" r="1.9" fill="#293F3B"/><Circle cx="90" cy="40" r="1.9" fill="#293F3B"/><Path d="M78 47 Q83 50 89 46" fill="none" stroke="#934B37" strokeWidth="1.8"/></>}
    <Path d="M0 103 Q11 96 24 104 M129 118 Q147 110 168 117" fill="none" stroke="#E9FEFF" strokeWidth="3.3" strokeLinecap="round"/>
  </Svg>;
}
function SharkBody({ close=false, surprised=false }) {
  return <Svg width="167" height="114" viewBox="0 0 167 114">
    <Defs><LinearGradient id="skin611" x1="0" y1="0" x2=".7" y2="1"><Stop offset="0" stopColor="#6D9DB7"/><Stop offset=".48" stopColor="#376B91"/><Stop offset="1" stopColor="#1A476C"/></LinearGradient></Defs>
    <Ellipse cx="81" cy="104" rx="68" ry="6" fill="#014765" opacity=".24"/>
    {/* Đầu luôn nằm BÊN PHẢI, đuôi bơi phía sau BÊN TRÁI. */}
    <Path d="M24 70 Q47 37 93 38 Q122 37 145 57 Q156 67 159 76 L145 86 Q119 94 94 86 Q59 88 24 70Z" fill="url(#skin611)" stroke="#1D4F72" strokeWidth="2.2"/>
    <Path d="M64 42 L82 11 L100 42Z" fill="#376E95" stroke="#1D4F72" strokeWidth="2.2"/>
    <Path d="M82 80 L73 103 L111 86Z" fill="#2A5B82" stroke="#1D4F72" strokeWidth="1.8"/>
    <Path d="M105 74 Q129 69 158 77 L146 91 Q126 102 107 82Z" fill="#E5F3F5" stroke="#1D4F72" strokeWidth="1.5"/>
    {/* Miệng lớn và hàm nhọn. */}
    <Path d="M113 76 Q135 71 159 77 L151 90 Q134 98 115 83Z" fill="#263B53" stroke="#112A40" strokeWidth="1.5"/>
    <Path d="M115 77 L121 84 L127 75 L133 84 L139 75 L145 83 L151 77 L156 79 L148 87 L140 89 L130 87 L122 87Z" fill="#FFF9EA" stroke="#D3E0DF" strokeWidth=".7"/>
    <Path d="M122 91 L128 84 L134 94 L140 85 L146 91" fill="#FFF9EA" stroke="#D3E0DF" strokeWidth=".6"/>
    <Path d="M119 58 L139 54" stroke="#17394F" strokeWidth="3.5" strokeLinecap="round"/>
    {surprised?<Circle cx="132" cy="63" r="4.5" fill="#FFF"/>:<Ellipse cx="132" cy="63" rx="4.1" ry="3.3" fill="#112C44"/>}
    <Circle cx="133" cy="62" r="1" fill="#FFF"/>
    <Path d="M105 67 Q111 69 116 66" fill="none" stroke="#1B4867" strokeWidth="1.4"/>
    {close&&<Path d="M157 71 L164 66" stroke="#E6F8FD" strokeWidth="2.5" strokeLinecap="round"/>}
  </Svg>;
}
function SharkTail() {
  return <Svg width="59" height="91" viewBox="0 0 59 91">
    <Path d="M51 42 Q29 35 8 7 Q17 39 4 80 Q32 59 52 56Z" fill="#42799C" stroke="#1D4F72" strokeWidth="2.5"/>
    <Path d="M12 18 Q27 43 42 45" fill="none" stroke="#83AEC1" strokeWidth="2.2" opacity=".7"/>
  </Svg>;
}
function SplashArt() {
  return <Svg width="145" height="100" viewBox="0 0 145 100">
    <Path d="M12 87 Q20 51 35 72 Q41 32 52 65 Q61 11 73 58 Q91 21 99 62 Q117 42 133 85 Q71 67 12 87Z" fill="#DDFBFF" opacity=".92"/>
    <Path d="M14 87 Q55 74 78 84 T136 84" fill="none" stroke="#FFF" strokeWidth="5"/>
    <G fill="#F5FEFF"><Circle cx="21" cy="35" r="5"/><Circle cx="110" cy="25" r="4"/><Circle cx="80" cy="13" r="3"/></G>
  </Svg>;
}
function OceanScene({ seconds, duration, outcome, reduceMotion, compact=false }) {
  const wave=useRef(new Animated.Value(0)).current;
  const bob=useRef(new Animated.Value(0)).current;
  const tail=useRef(new Animated.Value(0)).current;
  const chase=useRef(new Animated.Value(0)).current;
  const burst=useRef(new Animated.Value(0)).current;
  const [width,setWidth]=useState(340);
  const fraction=Math.max(0,Math.min(1,seconds/Math.max(1,duration)));
  const isCaught=outcome==='timeout'||outcome==='wrong';
  const isWin=outcome==='correct';
  useEffect(()=>{
    if(reduceMotion){wave.setValue(0);bob.setValue(0);tail.setValue(0);return;}
    const w=Animated.loop(Animated.sequence([Animated.timing(wave,{toValue:1,duration:1700,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),Animated.timing(wave,{toValue:0,duration:1700,easing:Easing.inOut(Easing.sin),useNativeDriver:true})]));
    const b=Animated.loop(Animated.sequence([Animated.timing(bob,{toValue:1,duration:880,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),Animated.timing(bob,{toValue:0,duration:880,easing:Easing.inOut(Easing.sin),useNativeDriver:true})]));
    const t=Animated.loop(Animated.sequence([Animated.timing(tail,{toValue:1,duration:380,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),Animated.timing(tail,{toValue:0,duration:380,easing:Easing.inOut(Easing.sin),useNativeDriver:true})]));
    w.start();b.start();t.start();return ()=>{w.stop();b.stop();t.stop();};
  },[wave,bob,tail,reduceMotion]);
  const sharkX=isWin?-68:isCaught?Math.max(52,width*.25):Math.max(0,(1-fraction)*Math.max(52,width*.25));
  useEffect(()=>{
    const a=Animated.timing(chase,{toValue:sharkX,duration:reduceMotion?0:isCaught?450:580,easing:Easing.out(Easing.cubic),useNativeDriver:true});a.start();return ()=>a.stop();
  },[chase,sharkX,reduceMotion,isCaught]);
  useEffect(()=>{
    burst.setValue(0);
    if(!outcome||reduceMotion)return;
    const a=Animated.timing(burst,{toValue:1,duration:650,easing:Easing.out(Easing.back(1.3)),useNativeDriver:true});a.start();return ()=>a.stop();
  },[outcome,burst,reduceMotion]);
  const boatLeft=Math.max(174,width*.57);
  const tailAngle=reduceMotion?'0deg':tail.interpolate({inputRange:[0,1],outputRange:['-13deg','13deg']});
  return <View style={[seaStyles.frame,compact&&{height:132,borderRadius:16}]} onLayout={e=>setWidth(e.nativeEvent.layout.width)} accessibilityLabel="Cá mập hướng sang phải đuổi theo thuyền của Bin trên biển" accessible>
    <OceanBackdrop/>
    <Animated.View pointerEvents="none" style={[seaStyles.shark,compact&&{bottom:-22,left:-42},{transform:[{scale:compact?.74:1},{translateX:chase},{translateY:reduceMotion?0:bob.interpolate({inputRange:[0,1],outputRange:[2,-4]})}]}]}>
      <Animated.View style={[seaStyles.tail,{transform:[{rotate:tailAngle}]}]}><SharkTail/></Animated.View>
      <SharkBody close={fraction<.24||isCaught} surprised={isWin}/>
    </Animated.View>
    <Animated.View pointerEvents="none" style={[seaStyles.boat,compact&&{bottom:-19},{left:compact?Math.max(133,width*.52):boatLeft,transform:[{scale:compact?.72:1},{translateX:isWin?20:0},{translateY:reduceMotion?0:wave.interpolate({inputRange:[0,1],outputRange:[-3,4]})},{rotate:!reduceMotion&&fraction<.20&&!outcome?'1.2deg':'0deg'}]}]}><BoatArt danger={fraction<.22||isCaught} winning={isWin}/></Animated.View>
    <Animated.View pointerEvents="none" style={[seaStyles.foreWave,{transform:[{translateX:reduceMotion?0:wave.interpolate({inputRange:[0,1],outputRange:[-14,8]})}]}]}><Svg width="120%" height="28" viewBox="0 0 430 28"><Path d="M0 12 Q20 1 40 12 T80 12 T120 12 T160 12 T200 12 T240 12 T280 12 T320 12 T360 12 T400 12 L430 28 L0 28Z" fill="#006D99" opacity=".50"/><Path d="M0 12 Q20 1 40 12 T80 12 T120 12 T160 12 T200 12 T240 12 T280 12 T320 12 T360 12 T400 12" stroke="#BAFBFF" strokeWidth="2.2" fill="none" opacity=".8"/></Svg></Animated.View>
    {isCaught&&<Animated.View pointerEvents="none" style={[seaStyles.splash,compact&&{bottom:-26},{left:compact?Math.max(106,width*.34):Math.max(130,width*.40),opacity:reduceMotion?1:burst,transform:[{scale:compact?.70:1},{translateY:reduceMotion?0:wave.interpolate({inputRange:[0,1],outputRange:[2,-4]})}]}]}><SplashArt/></Animated.View>}
    {isWin&&<Animated.View pointerEvents="none" style={[seaStyles.ribbon,{opacity:reduceMotion?1:burst,transform:[{scale:reduceMotion?1:burst.interpolate({inputRange:[0,1],outputRange:[.6,1]})}]}]}><Text style={seaStyles.ribbonText}>★  TĂNG TỐC!</Text></Animated.View>}
    {!outcome&&fraction<.20&&<View style={seaStyles.warning}><Text style={seaStyles.warningText}>CẨN THẬN! CÁ MẬP ĐANG ÁP SÁT</Text></View>}
  </View>;
}
const seaStyles=StyleSheet.create({
 frame:{height:240,borderRadius:23,overflow:'hidden',backgroundColor:'#69CAFA',position:'relative',borderWidth:2,borderColor:'#D2F5FF'},
 shark:{position:'absolute',left:-28,bottom:12,width:167,height:114},
 tail:{position:'absolute',left:-14,top:19,width:59,height:91,zIndex:1},
 boat:{position:'absolute',bottom:14,width:174,height:125,zIndex:2},
 foreWave:{position:'absolute',bottom:-2,left:-10,width:'120%',height:28,zIndex:3},
 splash:{position:'absolute',bottom:3,zIndex:4},
 ribbon:{position:'absolute',top:13,right:13,backgroundColor:'#FFF3BC',borderColor:'#FFF',borderWidth:2,paddingVertical:8,paddingHorizontal:13,borderRadius:20,zIndex:5},
 ribbonText:{fontSize:13,color:'#855016',fontWeight:'900'},
 warning:{position:'absolute',top:12,left:12,backgroundColor:'#AA342D',borderRadius:10,paddingVertical:6,paddingHorizontal:9,zIndex:5},
 warningText:{color:'#FFF',fontSize:10,fontWeight:'900'}
});

// V6.2: thao tác kéo thực với PanResponder; chạm thẻ rồi chạm đích là lựa chọn thay thế.
const DRAG_GAMES = [
 {id:'fraction',title:'Ghép phân số',topic:'fractions',intro:'Ghép các phân số bằng nhau.',sources:[['a','1/2'],['b','2/3'],['c','3/4']],targets:[['c','6/8'],['a','3/6'],['b','4/6']],explain:'Nhân cả tử số và mẫu số với cùng một số để được phân số bằng nhau.'},
 {id:'expression',title:'Ghép phép tính',topic:'multiply',intro:'Đưa từng kết quả về đúng phép tính.',sources:[['a','125 × 4'],['b','36 × 5'],['c','240 : 6']],targets:[['b','180'],['c','40'],['a','500']],explain:'Tính giá trị biểu thức rồi so sánh với kết quả.'},
 {id:'steps',title:'Sắp xếp lời giải',topic:'word',intro:'Bài toán: Có 240 kg gạo, bán 85 kg buổi sáng và 67 kg buổi chiều. Sắp xếp các bước giải theo đúng thứ tự.',sources:[['a','Tính tổng số gạo đã bán'],['b','Tính số gạo còn lại'],['c','Ghi đáp số: 88 kg']],targets:[['a','Bước 1'],['b','Bước 2'],['c','Bước 3']],explain:'Trước tiên 85 + 67 = 152 kg; tiếp theo 240 − 152 = 88 kg; cuối cùng ghi đáp số.'},
 {id:'geometry',title:'Hình học và đơn vị',topic:'geometry',intro:'Ghép mỗi khái niệm với công thức hoặc kết quả.',sources:[['a','Chu vi hình vuông cạnh 5 cm'],['b','Diện tích HCN 8 × 3 cm'],['c','2 kg 300 g']],targets:[['c','2 300 g'],['a','20 cm'],['b','24 cm²']],explain:'Chu vi hình vuông = cạnh × 4; diện tích hình chữ nhật = dài × rộng; 1 kg = 1 000 g.'},
];
function DraggableToken({item,selected,placed,disabled,onSelect,onDrop,dropRefs}) {
 const drag=useRef(new Animated.ValueXY()).current;
 const active=useRef(false);
 const callbacks=useRef({onDrop,onSelect,dropRefs});callbacks.current={onDrop,onSelect,dropRefs};
 const pan=useRef(PanResponder.create({
  onStartShouldSetPanResponder:()=>false,
  onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>5||Math.abs(g.dy)>5,
  onPanResponderGrant:()=>{active.current=true;drag.setValue({x:0,y:0});},
  onPanResponderMove:Animated.event([null,{dx:drag.x,dy:drag.y}],{useNativeDriver:false}),
  onPanResponderRelease:(_,g)=>{
   if(active.current){active.current=false;const refs=callbacks.current.dropRefs.current;
    for(const key of Object.keys(refs)){const target=refs[key];if(target&&target.measureInWindow){target.measureInWindow((x,y,w,h)=>{if(g.moveX>=x&&g.moveX<=x+w&&g.moveY>=y&&g.moveY<=y+h)callbacks.current.onDrop(item[0],key);});}}
   }
   Animated.spring(drag,{toValue:{x:0,y:0},useNativeDriver:false}).start();
  },
  onPanResponderTerminate:()=>Animated.spring(drag,{toValue:{x:0,y:0},useNativeDriver:false}).start(),
 })).current;
 return <Animated.View {...pan.panHandlers} style={[dragStyles.token,selected&&dragStyles.selected,placed&&dragStyles.placed,{transform:drag.getTranslateTransform()}]}>
  <Pressable disabled={disabled} onPress={()=>onSelect(item[0])} accessibilityRole="button" accessibilityLabel={'Chọn '+item[1]} style={{minHeight:48,justifyContent:'center'}}><Text style={dragStyles.tokenText}>{item[1]}</Text></Pressable>
 </Animated.View>;
}
function DragMatchGame({onExit,onFinished}){
 const [game,setGame]=useState(DRAG_GAMES[0]);const [selected,setSelected]=useState(null);
 const [placements,setPlacements]=useState({});const [graded,setGraded]=useState(false);const [finished,setFinished]=useState(false);
 const dropRefs=useRef({});
 const start=next=>{setGame(next);setSelected(null);setPlacements({});setGraded(false);setFinished(false);dropRefs.current={};};
 const drop=(src,dest)=>{if(graded)return;setPlacements(old=>{const update={...old};for(const k of Object.keys(update))if(update[k]===src)delete update[k];update[dest]=src;return update;});setSelected(null);};
 const count=game.targets.filter(t=>placements[t[0]]===t[0]).length;
 const submit=()=>{if(graded)return;setGraded(true);};
 const finish=()=>{if(!graded||finished)return;setFinished(true);onFinished(game,count,game.targets.map(t=>({id:'drag-'+game.id+'-'+t[0],topic:game.topic,level:'Khá',question:t[1],answer:game.sources.find(s=>s[0]===t[0])[1],userAnswer:game.sources.find(s=>s[0]===placements[t[0]])?.[1]||'Chưa ghép',correct:placements[t[0]]===t[0],explanation:game.explain,hintUsed:0})));};
 return <View style={{flex:1}}><ScrollView keyboardShouldPersistTaps="handled" style={{flex:1}} contentContainerStyle={{gap:10,padding:14,paddingBottom:18}}><View style={dragStyles.panel}><Text style={dragStyles.title}>Học Toán bằng kéo thả</Text><Text style={dragStyles.help}>Kéo thẻ từ cột trái sang ô bên phải. Hoặc chạm thẻ rồi chạm ô đích.</Text></View>
 <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{DRAG_GAMES.map(g=><Pressable key={g.id} onPress={()=>start(g)} style={[dragStyles.tab,game.id===g.id&&dragStyles.tabActive]}><Text style={[dragStyles.tabText,game.id===g.id&&{color:'#fff'}]}>{g.title}</Text></Pressable>)}</View>
 <Text style={dragStyles.intro}>{game.intro}</Text>
 <View style={{flexDirection:'row',gap:11}}><View style={{flex:1,gap:10}}><Text style={dragStyles.column}>THẺ CẦN GHÉP</Text>{game.sources.map(s=><DraggableToken key={game.id+s[0]} item={s} selected={selected===s[0]} placed={Object.values(placements).includes(s[0])} disabled={graded} onSelect={setSelected} onDrop={drop} dropRefs={dropRefs}/>)}</View>
 <View style={{flex:1,gap:10}}><Text style={dragStyles.column}>VỊ TRÍ ĐÍCH</Text>{game.targets.map(t=><Pressable key={game.id+t[0]} ref={el=>{dropRefs.current[t[0]]=el;}} onPress={()=>selected!==null&&drop(selected,t[0])} style={[dragStyles.target,placements[t[0]]&&dragStyles.filled,graded&&{borderColor:placements[t[0]]===t[0]?'#16a34a':'#ef6b4a'}]}><Text style={dragStyles.targetTitle}>{t[1]}</Text><Text style={dragStyles.targetValue}>{placements[t[0]]?game.sources.find(s=>s[0]===placements[t[0]])?.[1]:'Thả thẻ vào đây'}</Text></Pressable>)}</View></View>
 {graded&&<View style={dragStyles.feedback}><Text style={dragStyles.feedbackTitle}>Con ghép đúng {count}/3 ô!</Text><Text style={dragStyles.help}>{game.explain}</Text>{game.targets.map(t=><Text key={t[0]} style={dragStyles.help}>{placements[t[0]]===t[0]?'✓':'•'} {t[1]} ← {game.sources.find(s=>s[0]===t[0])[1]}</Text>)}</View>}
 </ScrollView><View style={compactStyles.footer}><Button disabled={!graded&&Object.keys(placements).length!==3} onPress={graded?finish:submit}>{graded?"Lưu điểm và nhận sao →":"Kiểm tra kết quả"}</Button><View style={{flexDirection:"row",gap:12,justifyContent:"center"}}><Pressable onPress={()=>start(game)}><Text style={compactStyles.footerLink}>Chơi lại</Text></Pressable><Pressable onPress={onExit}><Text style={compactStyles.footerLink}>Về trang chủ</Text></Pressable></View></View></View>;
}
const dragStyles=StyleSheet.create({panel:{backgroundColor:'#E1F5FF',padding:18,borderRadius:20},title:{fontSize:22,fontWeight:'900',color:'#154F65'},help:{fontSize:13,lineHeight:20,color:'#385C66'},tab:{paddingHorizontal:12,paddingVertical:11,backgroundColor:'#e7eee9',borderRadius:12},tabActive:{backgroundColor:'#168451'},tabText:{color:'#2C5141',fontWeight:'800',fontSize:12},intro:{color:'#254C46',fontSize:16,fontWeight:'700',lineHeight:24},column:{color:'#52736B',fontSize:10,fontWeight:'900',letterSpacing:.6,minHeight:27},token:{padding:9,minHeight:96,justifyContent:'center',borderRadius:15,backgroundColor:'#FFF2CE',borderWidth:2,borderColor:'#E8C775',zIndex:8,elevation:3},selected:{borderColor:'#168451',backgroundColor:'#D8F6E3'},placed:{opacity:.52},tokenText:{fontWeight:'800',fontSize:14,color:'#554324',textAlign:'center'},target:{minHeight:96,padding:10,borderRadius:15,borderWidth:2,borderStyle:'dashed',borderColor:'#A3C9C0',backgroundColor:'#F6FFFC',justifyContent:'center',gap:5},filled:{backgroundColor:'#E5F8EB',borderStyle:'solid'},targetTitle:{color:'#205849',fontSize:13,fontWeight:'900',textAlign:'center'},targetValue:{color:'#58756A',fontSize:12,textAlign:'center'},feedback:{padding:15,backgroundColor:'#E5F8EB',borderRadius:16,gap:7},feedbackTitle:{fontSize:17,fontWeight:'900',color:'#185D43'}});


// V6.2.1: fixed footer OUTSIDE ScrollView, respecting Android/iOS keyboard and safe area.
// Large, data-driven diagrams for the current question. No network needed.
function MathIllustration({question, height=190}) {
  const v=question?.visual;
  if (!v) return null;
  if (v.type==='geometry') {
    const square=v.kind===2;
    const label=v.kind===0?'CHU VI': 'DIỆN TÍCH';
    const rectWidth=square?154:226;
    const rectHeight=square?134:120;
    const left=(320-rectWidth)/2, top=45;
    const end=left+rectWidth;
    return <View style={visualStyles.panel} accessibilityLabel={`Hình ${square?'vuông':'chữ nhật'} cạnh ${v.length} cm${square?'':`, chiều rộng ${v.width} cm`}`}>
      <Text style={visualStyles.title}>QUAN SÁT HÌNH VẼ</Text>
      <Svg width="100%" height={height} viewBox="0 0 320 205" preserveAspectRatio="xMidYMid meet">
        <Defs><LinearGradient id="math622fill" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#c1e4ff"/><Stop offset="1" stopColor="#e5f3ff"/></LinearGradient></Defs>
        <Rect x={left} y={top} width={rectWidth} height={rectHeight} rx="3" fill="url(#math622fill)" stroke="#2975c9" strokeWidth="2.5"/>
        {Array.from({length:Math.floor(rectWidth/21)},(_,i)=><Path key={'v'+i} d={`M${left+(i+1)*21} ${top} V${top+rectHeight}`} stroke="#9acbf3" strokeWidth=".7"/>)}
        {Array.from({length:Math.floor(rectHeight/21)},(_,i)=><Path key={'h'+i} d={`M${left} ${top+(i+1)*21} H${end}`} stroke="#9acbf3" strokeWidth=".7"/>)}
        <Path d={`M${left} 30 H${end} M${left} 25 V35 M${end} 25 V35`} stroke="#1e5c99" fill="none" strokeWidth="1.5"/>
        <SvgText x="160" y="23" textAnchor="middle" fontSize="17" fontWeight="bold" fill="#144d83">{`${v.length} cm`}</SvgText>
        {!square&&<><Path d={`M${end+12} ${top} V${top+rectHeight} M${end+7} ${top} H${end+17} M${end+7} ${top+rectHeight} H${end+17}`} stroke="#1e5c99" strokeWidth="1.4" fill="none"/><SvgText x={end+23} y={top+rectHeight/2} fontSize="16" fontWeight="bold" fill="#144d83" textAnchor="middle" transform={`rotate(90 ${end+23} ${top+rectHeight/2})`}>{`${v.width} cm`}</SvgText></>}
        {square&&<SvgText x={end+14} y={top+rectHeight/2} fontSize="15" fontWeight="bold" fill="#144d83" transform={`rotate(90 ${end+14} ${top+rectHeight/2})`} textAnchor="middle">{`${v.length} cm`}</SvgText>}
        <SvgText x="160" y={top+rectHeight/2+7} textAnchor="middle" fill="#1c568f" fontWeight="bold" fontSize="21">{v.kind===0?'P = ?':'S = ?'}</SvgText>
        <SvgText x="160" y="198" fontSize="11" fill="#557b94" textAnchor="middle">Hình minh họa, không theo tỉ lệ</SvgText>
      </Svg>
      <Text style={visualStyles.tip}>{label}: quan sát số đo trên hình trước khi tính.</Text>
    </View>;
  }
  if(v.type==='fraction') {
    const count=Math.max(1,Math.min(24,v.denominator));
    const filled=Math.max(0,Math.min(count,v.numerator));
    const cols=count>12?8:count>6?6:count, rows=Math.ceil(count/cols);
    const size=Math.min(38,220/cols), gap=3;
    const makeGrid=(numerator,tag)=><View style={{alignItems:'center',gap:6,flex:1}}><Text style={visualStyles.fractionLabel}>{tag}</Text><View style={{flexDirection:'row',flexWrap:'wrap',width:cols*(size+gap),gap}}>{Array.from({length:count},(_,i)=><View key={i} style={{width:size,height:size,backgroundColor:i<numerator?'#53a6e5':'#e9f3fc',borderWidth:1,borderColor:'#7eb9e5',borderRadius:4}}/>)}</View><Text style={visualStyles.fractionLabel}>{numerator}/{v.denominator}</Text></View>;
    return <View style={visualStyles.panel}><Text style={visualStyles.title}>HÌNH MINH HỌA PHÂN SỐ</Text><View style={{flexDirection:'row',justifyContent:'space-evenly',gap:8}}>{makeGrid(filled,'Phân số thứ nhất')}{v.compareNumerator!=null&&makeGrid(v.compareNumerator,'Phân số thứ hai')}</View><Text style={visualStyles.tip}>Mỗi ô biểu diễn một phần bằng nhau.</Text></View>;
  }
  if(v.type==='units') return <View style={visualStyles.panel}><Text style={visualStyles.title}>ĐỔI ĐƠN VỊ</Text><Text style={visualStyles.unitLarge}>{v.amount} {['m','kg','km'][v.kind]}  →  ? {['cm','g','m'][v.kind]}</Text><Text style={visualStyles.tip}>{v.kind===0?'1 m = 100 cm':v.kind===1?'1 kg = 1 000 g':'1 km = 1 000 m'}</Text></View>;
  return null;
}
const visualStyles=StyleSheet.create({panel:{backgroundColor:'#ecf7ff',borderWidth:1,borderColor:'#bcdffb',borderRadius:18,paddingHorizontal:10,paddingVertical:11,gap:5,alignItems:'center',width:'100%'},title:{fontSize:11,fontWeight:'900',letterSpacing:.8,color:'#17628e'},tip:{fontSize:12,color:'#396c8b',textAlign:'center',lineHeight:17},fractionLabel:{fontSize:13,color:'#1d5d8c',fontWeight:'800'},unitLarge:{fontSize:22,color:'#154f79',fontWeight:'900',textAlign:'center',paddingVertical:22}});

const compactStyles=StyleSheet.create({
  root:{flex:1,backgroundColor:'#f7faf8',width:'100%',maxWidth:650,alignSelf:'center'},
  top:{paddingHorizontal:14,paddingTop:Platform.OS==='android'?((StatusBar.currentHeight||24)+10):Platform.OS==='web'?20:12,paddingBottom:9,backgroundColor:'#f7faf8'},
  topRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:46,gap:8},
  back:{width:46,height:46,borderRadius:13,backgroundColor:'#e7eee9',alignItems:'center',justifyContent:'center'},
  backText:{fontSize:26,lineHeight:31,color:'#176b4b'},
  title:{flex:1,fontSize:18,fontWeight:'900',color:'#203f38'},
  stage:{fontSize:13,fontWeight:'800',color:'#38685a'},
  body:{flex:1,minHeight:0},
  bodyContent:{paddingHorizontal:14,paddingTop:6,paddingBottom:16,gap:10,flexGrow:1},
  footer:{flexShrink:0,backgroundColor:'#fff',paddingHorizontal:14,paddingTop:9,paddingBottom:10,borderTopWidth:1,borderTopColor:'#ddebe3',gap:5},
  footerLink:{color:'#176b4b',fontSize:13,fontWeight:'800',paddingVertical:5},
  compactCard:{backgroundColor:'#fff',borderWidth:1,borderColor:'#dcebe0',borderRadius:16,padding:13,gap:10},
  smallLabel:{fontSize:10,color:'#27806c',fontWeight:'900',letterSpacing:1},
  qText:{fontSize:21,lineHeight:29,fontWeight:'900',color:'#203f38'},
  input:{borderColor:'#bce1ce',borderWidth:2,borderRadius:12,backgroundColor:'#fbfffc',paddingVertical:9,paddingHorizontal:13,fontSize:20,fontWeight:'800',color:'#203f38',minHeight:48},
  explanation:{borderRadius:14,padding:12,gap:5},
  hint:{backgroundColor:'#f0f7f0',borderRadius:12,padding:10,gap:5},
});
function CompactShell({title,back,onBack,meta,children,actionLabel,onAction,actionDisabled=false,extraAction}){
  return <SafeAreaView style={styles.root}><StatusBar barStyle="dark-content" backgroundColor="#f7faf8" translucent={Platform.OS==='android'}/>
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
      <View style={compactStyles.root}>
        <View style={compactStyles.top}><View style={compactStyles.topRow}>
          <Pressable onPress={()=>{Keyboard.dismiss();onBack();}} style={compactStyles.back} accessibilityRole="button" accessibilityLabel="Quay lại"><Text style={compactStyles.backText}>‹</Text></Pressable>
          <Text style={compactStyles.title} numberOfLines={1}>{title}</Text>{meta||null}
        </View></View>
        <ScrollView style={compactStyles.body} contentContainerStyle={compactStyles.bodyContent} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
          {children}
        </ScrollView>
        <View style={compactStyles.footer}><Button disabled={actionDisabled} onPress={()=>{Keyboard.dismiss();onAction();}}>{actionLabel}</Button>{extraAction||null}</View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function AdventureTrail({stages={}}){
  const colors=['#16a34a','#0891b2','#ca8a04','#7c3aed','#db2777'];
  return <View style={{backgroundColor:'#e4f5f4',borderRadius:18,padding:12,gap:8}}>
    <Text style={{fontSize:16,fontWeight:'900',color:'#175c5a'}}>🗺️ Đường đến lâu đài Toán học</Text>
    <Svg width="100%" height="122" viewBox="0 0 340 122">
      <Path d="M26 88 Q68 16 106 64 T177 64 T248 53 T314 27" fill="none" stroke="#ffffff" strokeWidth="12" strokeLinecap="round"/>
      <Path d="M26 88 Q68 16 106 64 T177 64 T248 53 T314 27" fill="none" stroke="#4b9d88" strokeWidth="4" strokeDasharray="6 6" strokeLinecap="round"/>
      {[[26,88],[97,59],[169,66],[242,51],[314,27]].map(([x,y],i)=><G key={i}>
        <Circle cx={x} cy={y} r="16" fill={colors[i]} stroke="#fff" strokeWidth="3"/>
        <SvgText x={x} y={y+5} textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">{i+1}</SvgText>
      </G>)}
    </Svg>
    <Text style={{fontSize:12,color:'#34655d'}}>Mở khóa khi đạt ít nhất 1 sao ở ải trước · {WORLDS.filter(w=>(stages[w.id]||0)>0).length}/5 vùng đã đạt sao.</Text>
  </View>;
}

export default function App() {
  const {height: viewportHeight}=useWindowDimensions();
  const shortViewport=viewportHeight<700;
  const illustrationHeight=shortViewport?135:viewportHeight<820?165:205;
  const [progress, setProgress] = useState(emptyProgress());
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState('home');
  const [topic, setTopic] = useState('add');
  const [level, setLevel] = useState('Khá');
  const [lessonIndex, setLessonIndex] = useState(0);
  const [activeLessonId,setActiveLessonId]=useState(null);
  const [lessonCheckInput,setLessonCheckInput]=useState('');
  const [lessonCheckResult,setLessonCheckResult]=useState(null);
  const [backupText,setBackupText]=useState('');
  const [restoreText,setRestoreText]=useState('');
  const [restoreConfirmed,setRestoreConfirmed]=useState(false);
  const [restoreSummary,setRestoreSummary]=useState(null);
  const [mode, setMode] = useState('practice');
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [startedAt, setStartedAt] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [testSize, setTestSize] = useState(10);
  const [gameStage, setGameStage] = useState(0);
  const [sessionDone, setSessionDone] = useState(null);
  const [examKind,setExamKind]=useState('topic');
  const [miniStep,setMiniStep]=useState(0);
  const [miniChoice,setMiniChoice]=useState(null);
  const [miniTarget,setMiniTarget]=useState(0);
  const [miniFinished,setMiniFinished]=useState(false);
  const [miniCorrect,setMiniCorrect]=useState(0);
  const [miniAnswers,setMiniAnswers]=useState([]);
  const [book,setBook]=useState('general');
  const [sharkQ,setSharkQ]=useState([]);
  const [sharkIndex,setSharkIndex]=useState(0);
  const [sharkTime,setSharkTime]=useState(30);
  const [sharkDuration,setSharkDuration]=useState(30);
  const [reduceMotion,setReduceMotion]=useState(false);
  const sharkDeadline=useRef(0);
  const [sharkOutcome,setSharkOutcome]=useState(null);
  const [sharkInput,setSharkInput]=useState('');
  const [sharkAnswers,setSharkAnswers]=useState([]);
  const [sharkStarted,setSharkStarted]=useState(0);
  const [wordTask,setWordTask]=useState(null);
  const [wordInputs,setWordInputs]=useState(['','','']);
  const [wordDone,setWordDone]=useState(false);
  const [wordPoints,setWordPoints]=useState(0);

  useEffect(() => {
    if(screen!=='shark'||sharkOutcome!==null)return undefined;
    // Deadline thực thay vì trừ 1 giây mỗi tick (tránh đồng hồ chạy chậm khi tab nền).
    const tick=()=>setSharkTime(Math.max(0,Math.ceil((sharkDeadline.current-Date.now())/1000)));
    tick();const timer=setInterval(tick,200);
    return ()=>clearInterval(timer);
  },[screen,sharkOutcome,sharkIndex]);
  useEffect(()=>{
    if(screen==='shark'&&sharkTime===0&&sharkOutcome===null){
      Keyboard.dismiss();setSharkOutcome('timeout');
    }
  },[screen,sharkTime,sharkOutcome]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SAVE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          const migrated=normalizeProgress(data);
          setProgress(migrated); setBook(BOOKS.some(b=>b.id===migrated.book)?migrated.book:'general');
        }
      } catch (e) { console.warn('Cannot load saved progress:', e); }
      setReady(true);
    })();
  }, []);

  async function save(data) {
    const normalized=normalizeProgress({...data,book:data.book||book});
    setProgress(normalized);
    try { await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(normalized)); }
    catch (e) { Alert.alert('Lỗi lưu dữ liệu', 'Không thể lưu kết quả. Hãy kiểm tra dung lượng thiết bị.'); }
  }

  function begin(newMode, selectedTopic = topic, selectedLevel = level) {
    const count = newMode === 'game' ? 5 : newMode === 'test' ? testSize : 10;
    let generated;
    if (newMode === 'test' && examKind !== 'topic') {
      const pool = examKind === 'mid' ? ['numbers','add','multiply','divide','geometry','units'] : examKind === 'advanced' ? ['patterns','word','multiply','divide','fractions'] : EXAM_TOPICS;
      const seen = new Set(progress.seen); const questions=[];
      for(let i=0;i<count;i++){const t=pool[i%pool.length]; const pack=createSet(t,selectedLevel,1,Array.from(seen)); pack.questions.forEach(item=>{questions.push(item);seen.add(item.id);});}
      generated={questions,seen:Array.from(seen)};
    } else generated = createSet(selectedTopic, selectedLevel, count, progress.seen);
    if (!generated.questions.length) {
      Alert.alert('Đã hết câu hỏi mới', 'Hãy chọn chủ đề hoặc cấp độ khác. Các câu đã làm vẫn được giữ trong lịch sử.');
      return;
    }
    save({ ...progress, seen: generated.seen });
    setTopic(selectedTopic); setLevel(selectedLevel); setMode(newMode);
    setQuestions(generated.questions); setIndex(0); setInput(''); setChecked(false);
    setCorrectCount(0); setAnswers([]); setStartedAt(Date.now()); setSessionDone(null); setHintLevel(0);
    setScreen('quiz');
  }

  const q = questions[index];
  const isCorrect = q ? normalize(input) === String(q.answer) : false;
  const currentTopic = TOPICS.find(t => t.id === topic) || TOPICS[0];
  const totalAnswered = progress.history.reduce((n, h) => n + h.total, 0);
  const totalCorrect = progress.history.reduce((n, h) => n + h.correct, 0);
  const average = totalAnswered ? Math.round(totalCorrect / totalAnswered * 100) : 0;
  const gameStars = (count, total) => count / total >= .9 ? 3 : count / total >= .75 ? 2 : count / total >= .6 ? 1 : 0;

  function checkAnswer() {
    if (!q || !normalize(input) || checked) return;
    Keyboard.dismiss(); setChecked(true);
    const right = normalize(input) === String(q.answer);
    if (right) setCorrectCount(c => c + 1);
    setAnswers(old => [...old, { id: q.id, topic: q.topic, level: q.level, question: q.question, answer: q.answer, userAnswer: input.trim(), correct: right, explanation: q.explanation, hintUsed: hintLevel }]);
  }

  async function nextQuestion() {
    if (index + 1 < questions.length) {
      setIndex(index + 1); setInput(''); setChecked(false); setHintLevel(0); return;
    }
    const stars = mode === 'game' ? gameStars(correctCount, questions.length) : 0;
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(), mode, topic, level, total: questions.length,
      correct: correctCount, score: Math.round(correctCount / questions.length * 100) / 10,
      seconds: Math.round((Date.now() - startedAt) / 1000), stars, answers,
    };
    const stages={...progress.stages};
    if(mode==='game') stages[topic]=Math.max(stages[topic]||0,stars);
    const badges=Array.from(new Set([...(progress.badges||[]), ...(correctCount===questions.length?['Hoàn hảo']:[]), ...(progress.history.length+1>=5?['Chăm chỉ']:[]), ...(stars===3?['Vượt ải xuất sắc']:[])]));
    await save({ ...progress, history: [record, ...progress.history], stars: progress.stars + stars, stages, badges });
    setSessionDone(record); setScreen('result');
  }

  function beginReview(){
    const wrong=recentMistakes(progress.history,5);
    if(!wrong.length){setScreen('reviewPlan');return;}
    const selected=wrong.map(a=>({id:a.id,topic:a.topic,level:a.level||'Khá',question:a.question,
      answer:a.answer,explanation:a.explanation||'Hãy kiểm tra lại phép tính và đối chiếu đáp án.'}));
    setMode('review');setTopic(selected[0].topic);setLevel(selected[0].level);
    setQuestions(selected);setIndex(0);setInput('');setChecked(false);setCorrectCount(0);
    setAnswers([]);setStartedAt(Date.now());setSessionDone(null);setHintLevel(0);
    setScreen('quiz');
  }
  function beginMini(){ setMode('mini');setTopic('fractions');setMiniStep(0);setMiniChoice(null);setMiniTarget(randomInt(4,8));setMiniFinished(false);setMiniCorrect(0);setMiniAnswers([]);setScreen('mini');}
  async function miniNext(){
    if(miniChoice===null)return;
    const answer=miniStep+1; const right=miniChoice===answer;
    const rows=[...miniAnswers,{id:`mini-${miniTarget}-${miniStep}`,topic:'fractions',level:'Cơ bản',question:`Tô ${answer}/${miniTarget} phần của hình`,answer,userAnswer:miniChoice,correct:right,explanation:`Hình chia ${miniTarget} phần bằng nhau. Hãy chọn đúng ${answer} phần.`,hintUsed:0}];
    if(miniStep<3){setMiniCorrect(v=>v+(right?1:0));setMiniAnswers(rows);setMiniStep(v=>v+1);setMiniChoice(null);setMiniTarget(randomInt(4,8));return;}
    const correct=miniCorrect+(right?1:0), stars=gameStars(correct,4);
    const record={id:`mini-${Date.now()}`,date:new Date().toISOString(),mode:'mini',topic:'fractions',level:'Cơ bản',total:4,correct,score:correct/4*10,seconds:0,stars,answers:rows};
    const stages={...progress.stages,fractions:Math.max(progress.stages.fractions||0,stars)};
    await save({...progress,history:[record,...progress.history],stars:progress.stars+stars,stages,badges:Array.from(new Set([...(progress.badges||[]),...(correct===4?['Bậc thầy phân số']:[])]))});
    setSessionDone(record);setMiniFinished(true);setScreen('result');
  }

  function startShark(){
    const pack=createSet(topic,level,5,progress.seen);
    if(pack.questions.length<5){Alert.alert('Chưa đủ câu hỏi mới','Hãy chọn chủ đề khác để chơi đủ 5 câu.');return;}
    save({...progress,seen:pack.seen});
    sharkDeadline.current=Date.now()+sharkDuration*1000;setSharkQ(pack.questions);setSharkIndex(0);setSharkTime(sharkDuration);
    setSharkOutcome(null);setSharkInput('');setSharkAnswers([]);setSharkStarted(Date.now());setScreen('shark');
  }
  function checkShark(){
    if(sharkOutcome!==null || !normalize(sharkInput))return;
    Keyboard.dismiss();
    if(Date.now()>=sharkDeadline.current){setSharkTime(0);setSharkOutcome('timeout');return;}
    setSharkOutcome(normalize(sharkInput)===String(sharkQ[sharkIndex].answer)?'correct':'wrong');
  }
  async function nextShark(){
    const item=sharkQ[sharkIndex];
    const right=sharkOutcome==='correct';
    const rows=[...sharkAnswers,{id:item.id,topic:item.topic,level:item.level,question:item.question,answer:item.answer,userAnswer:sharkOutcome==='timeout'?'Hết giờ':sharkInput.trim(),correct:right,explanation:item.explanation,hintUsed:0,timedOut:sharkOutcome==='timeout'}];
    if(sharkIndex+1<sharkQ.length){
      sharkDeadline.current=Date.now()+sharkDuration*1000;setSharkAnswers(rows);setSharkIndex(i=>i+1);setSharkInput('');setSharkTime(sharkDuration);setSharkOutcome(null);return;
    }
    const correct=rows.filter(a=>a.correct).length;
    const stars=gameStars(correct,rows.length);
    const record={id:'shark-'+Date.now(),date:new Date().toISOString(),mode:'shark',topic,level,total:rows.length,correct,score:correct/rows.length*10,seconds:Math.round((Date.now()-sharkStarted)/1000),stars,answers:rows};
    await save({...progress,history:[record,...progress.history],stars:progress.stars+stars,badges:Array.from(new Set([...(progress.badges||[]),...(correct===rows.length?['Thuyền trưởng Toán học']:[])]))});
    setMode('shark');setSessionDone(record);setScreen('result');
  }
  function startWord(){
    const morning=randomInt(20,45), afternoon=randomInt(15,35), bags=randomInt(10,30);
    setWordTask({morning,afternoon,stock:morning+afternoon+bags*4, sold:morning+afternoon,left:bags*4,bags});
    setWordInputs(['','','']);setWordDone(false);setWordPoints(0);setScreen('wordSteps');
  }
  async function gradeWord(){
    if(!wordTask || wordDone || wordInputs.some(x=>!normalize(x)))return;
    const expected=[wordTask.sold,wordTask.left,wordTask.bags];
    const weights=[3,3,4];const flags=expected.map((v,i)=>normalize(wordInputs[i])===String(v));
    const points=flags.reduce((n,flag,i)=>n+(flag?weights[i]:0),0);
    const rows=expected.map((v,i)=>({id:'word-'+i+'-'+Date.now(),topic:'word',level:'Khá',question:['Tính số gạo đã bán','Tính số gạo còn lại','Tính số túi 4 kg'][i],answer:v,userAnswer:wordInputs[i],correct:flags[i],explanation:['Cộng số gạo bán buổi sáng và buổi chiều.','Lấy số gạo ban đầu trừ số đã bán.','Lấy số gạo còn lại chia 4.'][i],hintUsed:0}));
    const record={id:'steps-'+Date.now(),date:new Date().toISOString(),mode:'steps',topic:'word',level:'Khá',total:3,correct:flags.filter(Boolean).length,score:points,seconds:0,stars:0,answers:rows};
    await save({...progress,history:[record,...progress.history]});setWordPoints(points);setWordDone(true);
  }
  function startMatch(){setScreen('dragGame');}
  async function finishDrag(game,count,rows){
    const stars=gameStars(count,3);
    const record={id:'drag-'+Date.now(),date:new Date().toISOString(),mode:'drag',topic:game.topic,level:'Khá',total:3,correct:count,score:Math.round(count/3*100)/10,seconds:0,stars,answers:rows};
    await save({...progress,history:[record,...progress.history],stars:progress.stars+stars,badges:Array.from(new Set([...(progress.badges||[]),...(count===3?['Bậc thầy ghép hình']:[])]))});
    setMode('drag');setSessionDone(record);setScreen('result');
  }

  function openCurriculumLesson(id){
    const lesson=getLesson(id);
    if(!lesson)return;
    setActiveLessonId(id);setTopic(lesson.topic);setLessonCheckInput('');setLessonCheckResult(null);
    save({...progress,currentLesson:id});setScreen('curriculumLesson');
  }
  function markLessonDone(){
    if(!activeLessonId || !progress.lessonChecks?.[activeLessonId]?.correct)return;
    const completed=Array.from(new Set([...(progress.lessonsDone||[]),activeLessonId]));
    const next=CURRICULUM.find(l=>!completed.includes(l.id));
    save({...progress,lessonsDone:completed,currentLesson:next?next.id:null});
    setLessonCheckInput('');setLessonCheckResult(null);
    if(next){setActiveLessonId(next.id);setTopic(next.topic);}else setScreen('curriculum');
  }
  async function submitLessonCheck(){
    const lesson=getLesson(activeLessonId), check=makeLessonCheck(lesson);
    if(!check || !normalize(lessonCheckInput) || lessonCheckResult!==null)return;
    Keyboard.dismiss();
    const correct=normalize(lessonCheckInput)===String(check.answer);
    const prior=(progress.lessonChecks||{})[lesson.id];
    const nextChecks={...(progress.lessonChecks||{}),
      [lesson.id]:{topic:lesson.topic,correct:correct||Boolean(prior?.correct),attemptedAt:new Date().toISOString(),attempts:(prior?.attempts||0)+1}};
    const patch={...progress,lessonChecks:nextChecks};
    if(correct)patch.lessonsDone=Array.from(new Set([...(progress.lessonsDone||[]),lesson.id]));
    await save(patch);
    setLessonCheckResult(correct?'correct':'wrong');
  }
  function generateBackup(){
    const payload=makeBackup(progress,book);
    setBackupText(JSON.stringify(payload,null,2));
    setRestoreConfirmed(false);setRestoreSummary(null);setScreen('backup');
  }
  async function shareBackup(){
    try {
      const payload=backupText || JSON.stringify(makeBackup(progress,book),null,2);
      await Share.share({title:'Sao lưu MathKid 4 Pro',message:payload});
    } catch(e){Alert.alert('Không thể chia sẻ','Hãy sao chép văn bản sao lưu bên dưới để lưu riêng.');}
  }
  function previewRestore(){
    try {
      const restored=parseBackup(restoreText);
      setRestoreSummary(progressSummary(restored));
      setRestoreConfirmed(false);
    }catch(e){setRestoreSummary(null);Alert.alert('Bản sao lưu không hợp lệ',String(e.message||e));}
  }
  async function restoreBackup(){
    if(!restoreConfirmed||!restoreSummary)return;
    try {
      const restored=parseBackup(restoreText);
      // Safety net survives reload and can be used for manual recovery.
      await AsyncStorage.setItem(PRE_RESTORE_KEY, JSON.stringify(makeBackup(progress,book)));
      await AsyncStorage.setItem(SAVE_KEY,JSON.stringify(restored));
      setProgress(restored);setBook(BOOKS.some(b=>b.id===restored.book)?restored.book:'general');
      setRestoreText('');setRestoreSummary(null);setRestoreConfirmed(false);
      Alert.alert('Khôi phục hoàn tất','Dữ liệu cũ đã được lưu vào bản sao dự phòng trong thiết bị.');
      setScreen('parent');
    }catch(e){Alert.alert('Không thể khôi phục','Kiểm tra dữ liệu và dung lượng thiết bị: '+String(e.message||e));}
  }
  async function loadPreRestore(){
    try {
      const previous=await AsyncStorage.getItem(PRE_RESTORE_KEY);
      if(!previous){Alert.alert('Chưa có bản dự phòng','Bản này chỉ được tạo khi bạn thực hiện khôi phục dữ liệu.');return;}
      const p=parseBackup(previous);
      setRestoreText(previous);setRestoreSummary(progressSummary(p));setRestoreConfirmed(false);
      Alert.alert('Đã nạp bản dự phòng','Hãy kiểm tra các chỉ số bên dưới và xác nhận nếu muốn khôi phục.');
    }catch(e){Alert.alert('Không thể đọc bản dự phòng',String(e.message||e));}
  }
  function header(title, back = 'home') {
    return <View style={styles.header}><Pressable onPress={() => setScreen(back)} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.headerText}>{title}</Text><View style={{ width: 34 }} /></View>;
  }


  // Fixed-bottom layouts: these screens intentionally bypass the old page-wide ScrollView.
  if(ready && screen==='shark' && sharkQ[sharkIndex]){
    const item=sharkQ[sharkIndex];
    return <CompactShell title="Cá mập đuổi thuyền" onBack={()=>setScreen('home')}
      meta={<View style={[styles.timerPill,{paddingVertical:5,paddingHorizontal:10,minWidth:56},sharkTime<=10&&{backgroundColor:'#ffded1'}]}><Text style={[styles.timerText,{fontSize:17},sharkTime<=10&&{color:'#a93a23'}]}>{sharkTime}s</Text></View>}
      actionLabel={sharkOutcome===null?'Kiểm tra đáp án':sharkIndex+1===sharkQ.length?'Xem kết quả →':'Đi tiếp →'}
      actionDisabled={sharkOutcome===null&&!normalize(sharkInput)} onAction={sharkOutcome===null?checkShark:nextShark}>
      <View style={styles.rowBetween}><Text style={compactStyles.stage}>Chặng {sharkIndex+1}/{sharkQ.length}</Text><Text style={styles.chaseLabel}>{sharkOutcome===null?`${Math.round(sharkTime/sharkDuration*100)}% an toàn`:sharkOutcome==='correct'?'Thoát hiểm!':'Về bến an toàn'}</Text></View>
      <View style={[styles.oceanProgress,{height:7,marginVertical:0}]}><View style={[styles.oceanProgressFill,{width:`${sharkTime/sharkDuration*100}%`,backgroundColor:sharkTime<=10?'#f66b45':sharkTime<=Math.ceil(sharkDuration*.35)?'#f5b83a':'#1fad82'}]}/></View>
      <OceanScene compact seconds={sharkTime} duration={sharkDuration} outcome={sharkOutcome} reduceMotion={reduceMotion}/>
      <View style={compactStyles.compactCard}><Text style={compactStyles.smallLabel}>THỬ THÁCH · CÂU {sharkIndex+1}</Text><Text style={compactStyles.qText}>{item.question}</Text>
      <TextInput style={compactStyles.input} keyboardType="number-pad" placeholder="Nhập đáp án của con" placeholderTextColor="#819a9c" value={sharkInput} onChangeText={setSharkInput} editable={sharkOutcome===null} returnKeyType="done" onSubmitEditing={checkShark} accessibilityLabel="Nhập đáp án thử thách vượt biển" />
      </View>
      {sharkOutcome!==null&&<View style={[compactStyles.explanation,{backgroundColor:sharkOutcome==='correct'?'#e4f8e9':'#fff2de'}]}><Text style={styles.missionFeedbackTitle}>{sharkOutcome==='correct'?'Xuất sắc! Thuyền tăng tốc!':sharkOutcome==='timeout'?'Cá mập đuổi kịp rồi!':'Chưa đúng rồi!'}</Text><Text style={styles.paragraph}>Đáp án: {formatNum(item.answer)}</Text><Text style={styles.paragraph}>{item.explanation}</Text></View>}
    </CompactShell>;
  }
  if(ready && screen==='quiz' && q){
    return <CompactShell title={mode==='game'?'Vượt ải':mode==='test'?'Kiểm tra':mode==='review'?'Ôn câu từng sai':'Luyện tập'} onBack={()=>setScreen('home')}
      meta={<Text style={styles.progressText}>{index+1}/{questions.length}</Text>}
      actionLabel={!checked?(mode==='test'?'Ghi nhận câu trả lời':'Kiểm tra đáp án'):(index+1===questions.length?'Xem kết quả →':'Câu tiếp theo →')}
      actionDisabled={!checked&&!normalize(input)} onAction={checked?nextQuestion:checkAnswer}>
      <View style={styles.rowBetween}><Text style={styles.muted}>{mode==='test'&&examKind!=='topic'?'Đề tổng hợp':currentTopic.title} · {level}</Text><Text style={styles.progressText}>Câu {index+1}/{questions.length}</Text></View>
      <View style={[styles.progressTrack,{marginVertical:0}]}><View style={[styles.progressFill,{width:`${(index+1)/questions.length*100}%`}]} /></View>
      <View style={[compactStyles.compactCard,q.visual&&{flexGrow:1,justifyContent:'space-around'}]}><Text style={compactStyles.smallLabel}>TÍNH VÀ ĐIỀN ĐÁP ÁN</Text><Text style={compactStyles.qText}>{q.question}</Text>
        <MathIllustration question={q} height={illustrationHeight}/>
        <TextInput style={[compactStyles.input,checked&&{borderColor:isCorrect?GREEN:'#d14b4b'}]} value={input} onChangeText={setInput} editable={!checked} placeholder="Nhập đáp án" placeholderTextColor="#91a09a" keyboardType="number-pad" returnKeyType="done" onSubmitEditing={checkAnswer} accessibilityLabel="Đáp án của con"/>
      </View>
      {checked&&mode!=='test'&&<View style={[compactStyles.explanation,{backgroundColor:isCorrect?'#e6f4ea':'#fff0ed'}]}><Text style={styles.feedbackTitle}>{isCorrect?'Chính xác!':'Đáp án đúng: '+formatNum(q.answer)}</Text><Text style={styles.paragraph}>{q.explanation}</Text></View>}
      {!checked&&mode!=='test'&&<View style={compactStyles.hint}><Pressable onPress={()=>setHintLevel(v=>Math.min(3,v+1))}><Text style={compactStyles.footerLink}>💡 Gợi ý {hintLevel}/3</Text></Pressable>{hintLevel>0&&<Text style={styles.paragraph}>{hintLevel===1?'Đọc kỹ đề: con cần tìm gì?':hintLevel===2?'Hãy viết phép tính và kiểm tra từng bước.':q.explanation}</Text>}</View>}
    </CompactShell>;
  }
  if(ready && screen==='wordSteps' && wordTask){
    return <CompactShell title="Giải toán 3 bước" onBack={()=>setScreen('home')} meta={<Text style={styles.progressText}>{wordDone?`${wordPoints}/10`:'3 bước'}</Text>}
      actionLabel={wordDone?'Làm bài mới':'Chấm bài'} actionDisabled={!wordDone&&wordInputs.some(v=>!normalize(v))} onAction={wordDone?startWord:gradeWord}>
      <View style={compactStyles.compactCard}><Text style={compactStyles.smallLabel}>BÀI TOÁN CỬA HÀNG GẠO</Text><Text style={styles.paragraph}>Cửa hàng có {wordTask.stock} kg gạo. Sáng bán {wordTask.morning} kg, chiều bán {wordTask.afternoon} kg. Số gạo còn lại chia đều vào các túi 4 kg. Hỏi được bao nhiêu túi?</Text></View>
      {['Tổng số gạo đã bán (kg) · 3 điểm','Số gạo còn lại (kg) · 3 điểm','Số túi 4 kg · 4 điểm'].map((label,i)=><View key={i} style={compactStyles.compactCard}><Text style={styles.rowTitle}>Bước {i+1}: {label}</Text><TextInput style={compactStyles.input} keyboardType="number-pad" value={wordInputs[i]} onChangeText={s=>setWordInputs(old=>old.map((v,j)=>j===i?s:v))} editable={!wordDone} placeholder="Nhập kết quả"/>{wordDone&&<Text style={styles.paragraph}>{normalize(wordInputs[i])===String([wordTask.sold,wordTask.left,wordTask.bags][i])?'Đúng':'Chưa đúng'} · Đáp án: {formatNum([wordTask.sold,wordTask.left,wordTask.bags][i])}</Text>}</View>)}
      {wordDone&&<View style={[compactStyles.explanation,{backgroundColor:'#e6f4ea'}]}><Text style={styles.feedbackTitle}>Kết quả: {wordPoints}/10</Text><Text style={styles.paragraph}>Bước 1: {wordTask.morning} + {wordTask.afternoon} = {wordTask.sold} kg.</Text><Text style={styles.paragraph}>Bước 2: {wordTask.stock} − {wordTask.sold} = {wordTask.left} kg.</Text><Text style={styles.paragraph}>Bước 3: {wordTask.left} : 4 = {wordTask.bags} túi.</Text></View>}
    </CompactShell>;
  }
  if(ready && screen==='dragGame'){
    return <SafeAreaView style={styles.root}><StatusBar barStyle="dark-content" backgroundColor="#f7faf8"/><View style={compactStyles.root}><View style={compactStyles.top}><View style={compactStyles.topRow}><Pressable onPress={()=>setScreen('home')} style={compactStyles.back}><Text style={compactStyles.backText}>‹</Text></Pressable><Text style={compactStyles.title}>Kéo thả Toán học</Text></View></View><DragMatchGame onExit={()=>setScreen('home')} onFinished={finishDrag}/></View></SafeAreaView>;
  }

  if (!ready) return <SafeAreaView style={styles.root}><ActivityIndicator color={GREEN} size="large" style={{ marginTop: 80 }} /></SafeAreaView>;
  return <SafeAreaView style={styles.root}><StatusBar barStyle="dark-content" backgroundColor="#f7faf8" /><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.page,Platform.OS==='android'&&{paddingTop:(StatusBar.currentHeight||24)+12}]}>
    {screen === 'home' && <>
      <Text style={styles.brand}>🌟 MathKid 4 · {APP_VERSION}</Text><Text style={styles.muted}>Mỗi ngày một chút – Giỏi Toán từng bước</Text>
      <View style={styles.hero}><Text style={styles.heroTitle}>Chào nhà toán học nhí! 👋</Text><Text style={styles.heroText}>Sẵn sàng chinh phục thử thách hôm nay?</Text><Text style={styles.heroStars}>⭐ {progress.stars} ngôi sao  ·  ✅ {totalAnswered} câu đã làm</Text></View>
      <View style={styles.grid}>
        <Tile icon="📚" title="Học bài" subtitle="Kiến thức và ví dụ" color="#e6f4ea" onPress={() => setScreen('topics')} />
        <Tile icon="🧠" title="Ôn tập cá nhân hóa" subtitle="Sửa lỗi sai và xem tiến bộ" color="#f0eafd" onPress={() => setScreen("reviewPlan")} />
        <Tile icon="🧭" title="Gia sư offline" subtitle="Gợi ý theo kết quả thực tế" color="#e8f5ee" onPress={() => setScreen("coach")} />
        <Tile icon="📖" title="Lộ trình 120 thẻ học" subtitle={`${(progress.lessonsDone||[]).length}/120 hoàn thành`} color="#e0f2fe" onPress={() => setScreen('curriculum')} />
        <Tile icon="✏️" title="Luyện tập" subtitle="Câu hỏi mới mỗi lần" color="#eaf1ff" onPress={() => setScreen('choose')} />
        <Tile icon="🎮" title="Chơi Toán" subtitle="Mở khóa và ghép phân số" color="#fff3dc" onPress={() => setScreen('map')} />
        <Tile icon="🏆" title="Kiểm tra" subtitle="Đề chủ đề, giữa kỳ, cuối kỳ" color="#f1eafa" onPress={() => setScreen('testChoose')} />
        <Tile icon="📈" title="Thành tích" subtitle="Điểm và lịch sử" color="#ffe9ef" onPress={() => setScreen('history')} />
        <Tile icon="📒" title="Sổ tay lỗi sai" subtitle="Ôn tập câu đã sai" color="#fff2e8" onPress={() => setScreen('mistakes')} />
        <Tile icon="🗓️" title="Học 15 phút" subtitle="Luyện chủ đề cần ôn" color="#e8f5ef" onPress={() => setScreen('daily')} />
        <Tile icon="👨‍👩‍👧" title="Góc bố mẹ" subtitle="Theo dõi tiến bộ" color="#e6f5fa" onPress={() => setScreen('parent')} />
        <Tile icon="🚣" title="Cá mập đuổi thuyền" subtitle="5 câu · 30 giây/câu" color="#d9f5ff" onPress={() => setScreen('sharkChoose')} />
        <Tile icon="🧩" title="Kéo thả Toán học" subtitle="4 trò chơi tương tác" color="#fff1d7" onPress={startMatch} />
        <Tile icon="📝" title="Giải toán 3 bước" subtitle="Chấm điểm từng bước" color="#e8e6ff" onPress={startWord} />
        <Tile icon="📘" title="Chọn bộ SGK" subtitle="Cài đặt lộ trình tham khảo" color="#e9f2f9" onPress={() => setScreen('book')} />
      </View>
      <Text style={styles.footnote}>Bài học, trò chơi và kết quả được xử lý trên thiết bị. APK cần được đóng gói và thử nghiệm offline; Expo Snack cần mạng để tải ban đầu.</Text>
    </>}

    {screen === 'book' && <>{header('Chọn bộ sách')}<Text style={styles.section}>Con đang sử dụng bộ sách nào?</Text>{BOOKS.map(b=><Pressable key={b.id} onPress={()=>{setBook(b.id);save({...progress,book:b.id});}} style={[styles.choice,book===b.id&&styles.choiceActive]}><Text style={styles.choiceText}>{b.name}</Text><Text>{book===b.id?'✅':'○'}</Text></Pressable>)}<Text style={styles.footnote}>Bộ sách là thiết lập hồ sơ. Thứ tự và ma trận đề chính thức của từng sách chưa được đối chiếu; học theo lộ trình chung 120 thẻ.</Text><Button onPress={()=>setScreen('home')}>Xong</Button></>}

    {screen === 'sharkChoose' && <>
      {header('Chuyến phiêu lưu vượt biển')}
      <View style={styles.adventureIntro}><Text style={styles.adventureEyebrow}>CHƯƠNG 1 · ĐẠI DƯƠNG TOÁN HỌC</Text><Text style={styles.adventureHeadline}>Giải toán để thoát khỏi cá mập!</Text><OceanScene seconds={30} duration={30} outcome={null} reduceMotion={reduceMotion}/><Text style={styles.adventureDesc}>Bin cần con giúp lái thuyền qua 5 chặng. Đáp án đúng giúp thuyền tăng tốc. Hết giờ thì trở về bến an toàn và xem lời giải.</Text></View>
      <Text style={styles.section}>Chọn chủ đề</Text>
      {TOPICS.map(t=><Pressable key={t.id} onPress={()=>setTopic(t.id)} style={[styles.choice,topic===t.id&&styles.choiceActive]}><Text style={styles.choiceText}>{t.icon} {t.title}</Text><Text>{topic===t.id?'●':'○'}</Text></Pressable>)}
      <Text style={styles.section}>Độ khó</Text><View style={styles.levelRow}>{['Cơ bản','Khá','Nâng cao'].map(l=><Pressable key={l} onPress={()=>setLevel(l)} style={[styles.levelButton,level===l&&styles.levelActive]}><Text style={[styles.levelText,level===l&&{color:'white'}]}>{l}</Text></Pressable>)}</View>
      <Text style={styles.section}>Thời gian mỗi câu</Text><View style={styles.levelRow}>{[30,45,60].map(n=><Pressable key={n} onPress={()=>setSharkDuration(n)} style={[styles.levelButton,sharkDuration===n&&styles.levelActive]}><Text style={[styles.levelText,sharkDuration===n&&{color:'white'}]}>{n} giây</Text></Pressable>)}</View>
      <Pressable style={styles.motionToggle} onPress={()=>setReduceMotion(v=>!v)}><Text style={styles.choiceText}>Giảm chuyển động</Text><Text style={styles.choiceText}>{reduceMotion?'BẬT':'TẮT'}</Text></Pressable>
      <Button onPress={startShark}>Bắt đầu vượt biển →</Button>
    </>}

    {screen === 'shark' && sharkQ[sharkIndex] && <>
      {header('Cá mập đuổi thuyền','home')}
      <View style={styles.oceanTop}><View><Text style={styles.adventureEyebrow}>NHIỆM VỤ VƯỢT BIỂN</Text><Text style={styles.oceanStage}>Chặng {sharkIndex+1} / {sharkQ.length}</Text></View><View style={[styles.timerPill,sharkTime<=10&&{backgroundColor:'#FFDED1'}]}><Text style={[styles.timerText,sharkTime<=10&&{color:'#A93A23'}]}>{sharkTime}s</Text></View></View>
      <View style={styles.oceanProgress}><View style={[styles.oceanProgressFill,{width:`${sharkTime/sharkDuration*100}%`,backgroundColor:sharkTime<=10?'#F66B45':sharkTime<=Math.ceil(sharkDuration*.35)?'#F5B83A':'#1FAD82'}]}/></View>
      <View style={styles.chaseLabels}><Text style={styles.chaseLabel}>CÁ MẬP ĐANG TIẾN GẦN</Text><Text style={styles.chaseLabel}>{sharkOutcome===null?`${Math.round(sharkTime/sharkDuration*100)}% an toàn`:sharkOutcome==='correct'?'Thoát hiểm!':'Về bến an toàn'}</Text></View><OceanScene seconds={sharkTime} duration={sharkDuration} outcome={sharkOutcome} reduceMotion={reduceMotion}/>
      <View style={styles.sceneCaption}><Text style={styles.sceneCaptionText}>{sharkOutcome==='correct'?'Tuyệt vời! Bin đã đưa thuyền tăng tốc.':sharkOutcome==='timeout'?'Hết giờ! Bin đã trở về bến an toàn.':sharkOutcome==='wrong'?'Chưa đúng rồi! Hãy xem cách giải để đi tiếp.':sharkTime<=10?'Cá mập đã đến gần! Cố lên nào!':'Giải đúng để giúp Bin đưa thuyền ra xa cá mập.'}</Text></View>
      <View style={styles.missionCard}><Text style={styles.missionKicker}>THẺ NHIỆM VỤ · CÂU {sharkIndex+1}</Text><Text style={styles.missionQuestion}>{sharkQ[sharkIndex].question}</Text><TextInput style={styles.missionInput} keyboardType="number-pad" placeholder="Nhập đáp án của con" placeholderTextColor="#819A9C" value={sharkInput} onChangeText={setSharkInput} editable={sharkOutcome===null} accessibilityLabel="Nhập đáp án thử thách vượt biển" /></View>
      {sharkOutcome!==null?<><View style={[styles.missionFeedback,{backgroundColor:sharkOutcome==='correct'?'#E4F8E9':'#FFF2DE'}]}><Text style={styles.missionFeedbackTitle}>{sharkOutcome==='correct'?'Xuất sắc! Thuyền tăng tốc!':sharkOutcome==='timeout'?'Ôi không! Cá mập đuổi kịp rồi!':'Chưa đúng rồi! Thử thách tiếp theo nhé!'}</Text><Text style={styles.paragraph}>Đáp án đúng: {formatNum(sharkQ[sharkIndex].answer)}</Text><Text style={styles.paragraph}>{sharkQ[sharkIndex].explanation}</Text><Text style={styles.missionResultNote}>{sharkOutcome==='correct'?'Bin nhận được sao cho câu này!':'Bin đã về bến an toàn. Con có thể xem lời giải và đi tiếp.'}</Text></View><Button onPress={nextShark}>{sharkIndex+1===sharkQ.length?'Nhận kết quả chuyến đi →':'Sang chặng tiếp theo →'}</Button></>:<Button disabled={!normalize(sharkInput)} onPress={checkShark}>XÁC NHẬN · TĂNG TỐC →</Button>}
      <Text style={styles.footnote}>Không có cảnh bạo lực. Học thông thường vẫn không giới hạn thời gian.</Text>
    </>}

    {screen === 'wordSteps' && wordTask && <>{header('📝 Giải toán nhiều bước')}<Text style={styles.section}>Bài toán cửa hàng gạo</Text><View style={styles.card}><Text style={styles.paragraph}>Cửa hàng có {wordTask.stock} kg gạo. Buổi sáng bán {wordTask.morning} kg, buổi chiều bán {wordTask.afternoon} kg. Số gạo còn lại được chia đều vào các túi, mỗi túi 4 kg. Hỏi được bao nhiêu túi?</Text></View>{['Bước 1 · Tổng số gạo đã bán (kg) · 3 điểm','Bước 2 · Số gạo còn lại (kg) · 3 điểm','Bước 3 · Số túi 4 kg · 4 điểm'].map((lab,i)=><View key={i} style={styles.card}><Text style={styles.rowTitle}>{lab}</Text><TextInput style={styles.answerInput} keyboardType="number-pad" value={wordInputs[i]} onChangeText={s=>setWordInputs(old=>old.map((v,j)=>j===i?s:v))} editable={!wordDone} placeholder="Nhập kết quả"/>{wordDone&&<Text style={styles.paragraph}>{normalize(wordInputs[i])===String([wordTask.sold,wordTask.left,wordTask.bags][i])?'✅ Đúng':'❌ Chưa đúng'} · Đáp án: {formatNum([wordTask.sold,wordTask.left,wordTask.bags][i])}</Text>}</View>)}{wordDone?<><View style={styles.feedback}><Text style={styles.feedbackTitle}>Kết quả: {wordPoints}/10 điểm</Text><Text style={styles.paragraph}>Bước 1: {wordTask.morning} + {wordTask.afternoon} = {wordTask.sold} kg.</Text><Text style={styles.paragraph}>Bước 2: {wordTask.stock} − {wordTask.sold} = {wordTask.left} kg.</Text><Text style={styles.paragraph}>Bước 3: {wordTask.left} : 4 = {wordTask.bags} túi.</Text></View><Button onPress={startWord}>Làm bài mới</Button></>:<Button disabled={wordInputs.some(v=>!normalize(v))} onPress={gradeWord}>Chấm từng bước →</Button>}</>}

    {screen === 'dragGame' && <>{header('Kéo thả Toán học')}<DragMatchGame onExit={()=>setScreen('home')} onFinished={finishDrag}/></>}

    {screen === 'reviewPlan' && <>{header('Ôn tập cá nhân hóa')}
      <Text style={styles.section}>Kế hoạch 15 phút hôm nay</Text>
      <Text style={styles.muted}>Dựa trên lịch sử trong thiết bị. Không dùng AI hoặc gửi dữ liệu lên mạng.</Text>
      {dailyReviewPlan(progress.history,progress.lessonsDone||[]).steps.map((step,i)=><View key={i} style={styles.card}>
        <Text style={styles.rowTitle}>{i+1}. {step.title} · {step.minutes} phút</Text>
        <Text style={styles.paragraph}>{step.detail}</Text>
      </View>)}
      <Text style={styles.section}>Những câu còn cần ôn</Text>
      {recentMistakes(progress.history,5).length===0?<Text style={styles.muted}>Không còn câu sai chưa được làm đúng lại trong lịch sử. Con có thể luyện câu mới.</Text>:
        recentMistakes(progress.history,5).map((a,i)=><View key={a.id+'-'+i} style={styles.card}>
          <Text style={styles.rowTitle}>{i+1}. {a.kind}</Text>
          <Text style={styles.paragraph}>{a.question}</Text>
          <Text style={styles.muted}>Câu hỏi đã được đưa vào buổi ôn tập; đáp án chỉ hiện sau khi con trả lời.</Text>
        </View>)}
      {recentMistakes(progress.history,5).length>0&&<Button onPress={beginReview}>Làm lại tối đa 5 câu từng sai →</Button>}
      <Button secondary onPress={()=>{const plan=dailyReviewPlan(progress.history,progress.lessonsDone||[]);
        begin('practice',plan.topic,plan.level);}}>Luyện thêm chủ đề đề xuất →</Button>
      <Text style={styles.section}>Tiến bộ theo chủ đề</Text>
      <Text style={styles.muted}>So sánh tối đa 10 câu gần nhất với 10 câu trước đó. Chỉ hiện xu hướng khi mỗi nhóm có ít nhất 5 câu.</Text>
      {topicTrends(progress.history).map(t=><View key={t.topic} style={styles.card}>
        <Text style={styles.rowTitle}>{TOPICS.find(x=>x.id===t.topic)?.title||t.topic} · {t.status}</Text>
        <Text style={styles.paragraph}>{t.rate===null?'Chưa có dữ liệu':t.correct+'/'+t.sample+' câu đúng gần đây ('+Math.round(t.rate*100)+'%)'}.</Text>
        <Text style={styles.muted}>{t.change===null?'Chưa đủ dữ liệu để so sánh xu hướng':t.change===0?'Xu hướng ổn định':t.change>0?'Tăng '+t.change+' điểm phần trăm':'Giảm '+Math.abs(t.change)+' điểm phần trăm'}</Text>
        {t.topMistake&&<Text style={styles.muted}>Dạng cần xem lại: {t.topMistake}</Text>}
      </View>)}
    </>}
    {screen === 'coach' && <>{header('Gia sư offline')}
      <Text style={styles.section}>Gợi ý từ lịch sử học tập</Text>
      <Text style={styles.muted}>Phân tích tại thiết bị từ các câu đã làm; không sử dụng AI trực tuyến.</Text>
      {(()=>{const a=recommendLearning(progress.history,progress.lessonChecks||{});
        return <View style={styles.card}><Text style={styles.rowTitle}>Gợi ý: {TOPICS.find(t=>t.id===a.topic)?.title||a.topic}</Text>
          <Text style={styles.paragraph}>Mức bài tập: {a.level}. {a.status}.</Text>
          <Text style={styles.muted}>{a.total?('Dữ liệu gần đây: '+a.correct+'/'+a.total+' câu đúng.'):'Chưa đủ dữ liệu; bắt đầu luyện để có gợi ý.'}</Text>
          <Button onPress={()=>begin('practice',a.topic,a.level)}>Luyện chủ đề này →</Button>
        </View>})()}
      {evaluateLearning(progress.history,progress.lessonChecks||{}).map(a=><View key={a.topic} style={styles.card}>
        <Text style={styles.rowTitle}>{TOPICS.find(t=>t.id===a.topic)?.title||a.topic} · {a.status}</Text>
        <Text style={styles.muted}>{a.correct}/{a.total} câu đúng gần đây · {a.lessonCorrect}/{a.checked} kiểm tra thẻ đạt</Text>
        <Button secondary small onPress={()=>begin('practice',a.topic,a.level)}>Luyện mức {a.level} →</Button>
      </View>)}
    </>}
    {screen === 'curriculum' && <>
      {header('Lộ trình 120 thẻ học')}
      <Text style={styles.section}>30 mạch kiến thức × 4 hoạt động = 120 thẻ học</Text>
      <Text style={styles.muted}>Lộ trình kiến thức chung. Bốn hoạt động của cùng một mạch gồm Khám phá, Ví dụ, Vận dụng và Thử thách; chưa phải 120 bài độc lập được thẩm định theo từng bộ SGK.</Text>
      <View style={styles.card}><Text style={styles.rowTitle}>Đã hoàn thành {(progress.lessonsDone||[]).length}/120</Text><View style={styles.progressTrack}><View style={[styles.progressFill,{width:`${(progress.lessonsDone||[]).length/120*100}%`}]} /></View><Button onPress={()=>openCurriculumLesson(progress.currentLesson||getNextLesson(progress.lessonsDone||[]).id)}>Tiếp tục thẻ đang học →</Button></View>
      {TOPICS.map(t=>{const lessons=curriculumFor(t.id);if(!lessons.length)return null;return <View key={t.id} style={styles.card}><Text style={styles.rowTitle}>{t.icon} {t.title} · {lessons.filter(l=>(progress.lessonsDone||[]).includes(l.id)).length}/{lessons.length}</Text>{lessons.map(l=><Pressable key={l.id} onPress={()=>openCurriculumLesson(l.id)} style={[styles.lessonTab,(progress.lessonsDone||[]).includes(l.id)&&{backgroundColor:'#dcfce7'}]}><Text style={styles.lessonTabText}>{(progress.lessonsDone||[]).includes(l.id)?'✓ ':'○ '}{l.number}. {l.title}</Text></Pressable>)}</View>})}
    </>}
    {screen === 'curriculumLesson' && (()=>{const l=getLesson(activeLessonId);if(!l)return null;return <>
      {header('Thẻ học '+l.number+'/120','curriculum')}
      <View style={styles.card}><Text style={styles.muted}>{(TOPICS.find(t=>t.id===l.topic)?.title||l.topic)} · Hoạt động {l.stage+1}/4</Text><Text style={styles.section}>{l.title}</Text><Text style={styles.rowTitle}>Mục tiêu</Text><Text style={styles.paragraph}>{l.goal}</Text><Text style={styles.rowTitle}>Kiến thức cần nhớ</Text><Text style={styles.paragraph}>{l.rule}</Text><View style={styles.example}><Text style={styles.exampleTitle}>Ví dụ đã giải</Text><Text style={styles.paragraph}>{l.example}</Text></View><Text style={styles.rowTitle}>Con thực hành</Text><Text style={styles.paragraph}>{l.activity}</Text></View>
      <View style={styles.card}><Text style={styles.rowTitle}>Kiểm tra riêng cho thẻ học này</Text>
        <Text style={styles.paragraph}>{makeLessonCheck(l)?.question}</Text>
        <TextInput style={styles.answerInput} keyboardType="number-pad" value={lessonCheckInput} onChangeText={setLessonCheckInput} editable={lessonCheckResult===null} placeholder="Nhập đáp án" accessibilityLabel="Đáp án kiểm tra thẻ học"/>
        {lessonCheckResult!==null && <View style={styles.feedback}><Text style={styles.feedbackTitle}>{lessonCheckResult==='correct'?'✅ Đã đạt kiểm tra':'💡 Chưa đúng, thử lại nhé'}</Text>
          <Text style={styles.paragraph}>Đáp án: {makeLessonCheck(l)?.answer}. {makeLessonCheck(l)?.explanation}</Text></View>}
        {lessonCheckResult===null?<Button disabled={!normalize(lessonCheckInput)} onPress={submitLessonCheck}>Kiểm tra thẻ học →</Button>:
          lessonCheckResult==='wrong'?<Button secondary onPress={()=>{setLessonCheckResult(null);setLessonCheckInput('');}}>Thử lại câu này</Button>:
          <Button onPress={markLessonDone}>Sang thẻ tiếp theo →</Button>}
      </View>
      <Button secondary onPress={()=>begin('practice',l.topic,l.stage===3?'Nâng cao':l.stage===0?'Cơ bản':'Khá')}>Luyện thêm theo chủ đề →</Button>
      <Text style={styles.footnote}>120 câu kiểm tra riêng theo 30 mạch × 4 mức hoạt động. Luyện thêm vẫn lấy từ ngân hàng chủ đề.</Text>
    </>})()}
    {screen === 'topics' && <>{header('Học kiến thức')}<Text style={styles.section}>Chọn chủ đề</Text>{TOPICS.map(t => <Pressable key={t.id} style={[styles.topicRow, { backgroundColor: t.color }]} onPress={() => { setTopic(t.id); setLessonIndex(0); setScreen('lesson'); }}><Text style={styles.topicIcon}>{t.icon}</Text><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{t.title}</Text><Text style={styles.muted}>{t.description}</Text></View><Text style={styles.chevron}>›</Text></Pressable>)}</>}

    {screen === 'lesson' && <>{header(currentTopic.title, 'topics')}<Text style={styles.section}>Chọn bài học</Text>{currentTopic.lessons.map((l, i) => <Pressable key={i} style={[styles.lessonTab, lessonIndex === i && styles.lessonTabActive]} onPress={() => setLessonIndex(i)}><Text style={[styles.lessonTabText, lessonIndex === i && { color: '#fff' }]}>{i + 1}. {l[0]}</Text></Pressable>)}<View style={styles.card}><Text style={styles.section}>{currentTopic.lessons[lessonIndex][0]}</Text><Text style={styles.paragraph}>{currentTopic.lessons[lessonIndex][1]}</Text><View style={styles.example}><Text style={styles.exampleTitle}>💡 Ví dụ</Text><Text style={styles.paragraph}>{currentTopic.lessons[lessonIndex][2]}</Text></View></View><Button onPress={() => begin('practice', topic, level)}>Luyện tập chủ đề này →</Button></>}

    {screen === 'mistakes' && <>{header('Sổ tay lỗi sai')}<Button secondary onPress={()=>setScreen('reviewPlan')}>Mở buổi ôn tập cá nhân hóa →</Button><Text style={styles.section}>Các câu con từng làm sai</Text>{progress.history.flatMap(h => h.answers || []).filter(a => !a.correct).length === 0 ? <Text style={styles.muted}>Chưa có câu sai nào trong lịch sử.</Text> : progress.history.flatMap(h => h.answers || []).filter(a => !a.correct).slice(0, 40).map((a,i) => <View key={`${a.id}-${i}`} style={styles.card}><Text style={styles.rowTitle}>{a.question}</Text><Text style={styles.muted}>Con trả lời: {a.userAnswer} · Đúng: {formatNum(a.answer)}</Text><Text style={styles.paragraph}>{a.explanation}</Text></View>)}<Button secondary onPress={() => { const wrong = progress.history.flatMap(h => h.answers || []).filter(a=>!a.correct); if(wrong.length){ setTopic(wrong[0].topic); begin('practice',wrong[0].topic,wrong[0].level); } else setScreen('home'); }}>Luyện lại dạng bài còn yếu →</Button></>}
    {screen === 'daily' && <>{header('Kế hoạch 15 phút')}<Button secondary onPress={()=>setScreen('reviewPlan')}>Kế hoạch ôn theo lỗi sai →</Button><Text style={styles.section}>Lộ trình gợi ý hôm nay</Text><View style={styles.card}><Text style={styles.rowTitle}>📖 3 phút: Ôn kiến thức</Text><Text style={styles.paragraph}>Đọc lại một ví dụ trong chủ đề cần ôn.</Text></View><View style={styles.card}><Text style={styles.rowTitle}>✏️ 9 phút: Luyện 10 câu</Text><Text style={styles.paragraph}>Chủ đề được chọn theo tỷ lệ đúng trong các lượt đã hoàn thành.</Text></View><View style={styles.card}><Text style={styles.rowTitle}>🌟 3 phút: Xem lại lỗi sai</Text><Text style={styles.paragraph}>Đọc lời giải và thử làm lại trên giấy.</Text></View>{(() => { const ranked = TOPICS.map(t => { const st=topicStats(progress.history,t.id); const total=st.total; const good=st.correct; return { t, rate:total?good/total:0.7, total }; }).sort((a,b)=>a.rate-b.rate || b.total-a.total); const weak=ranked.find(x=>x.total>0 && x.rate<0.8); const picked=weak ? weak.t : TOPICS.find(t=>t.id==='add'); return <><Text style={styles.paragraph}>Chủ đề gợi ý: {picked.title}</Text><Button onPress={()=>begin('practice',picked.id,recommendedLevel(progress.history,picked.id))}>Bắt đầu học hôm nay →</Button></>; })()}</>}
    {screen === 'map' && <>{header('Bản đồ chinh phục')}<AdventureTrail stages={progress.stages||{}}/><Text style={styles.section}>5 vùng đất Toán học</Text><Text style={styles.muted}>Đạt ít nhất 1 sao ở ải trước để mở khóa ải tiếp theo. Tiến độ được lưu trên thiết bị.</Text>{WORLDS.map((m,i)=>{const unlocked=i===0||(progress.stages[WORLDS[i-1].id]||0)>0;return <Pressable key={m.id} disabled={!unlocked} style={[styles.card,{backgroundColor:unlocked?(i%2?'#fff5e7':'#eaf6ef'):'#edf0ee',opacity:unlocked?1:.6}]} onPress={()=>{setGameStage(i);setTopic(m.id);setScreen('gameChoose');}}><Text style={styles.rowTitle}>{unlocked?m.icon:'🔒'} Ải {i+1}: {m.name}</Text><Text style={styles.muted}>{unlocked?`5 thử thách · kỷ lục ${progress.stages[m.id]||0}/3 ⭐`:'Hoàn thành ải trước để mở khóa'}</Text></Pressable>})}<Button secondary onPress={beginMini}>🍰 Trò chơi tô phân số (4 lượt)</Button></>}

    {screen === 'mini' && <>{header('🍰 Ghép phân số','map')}<Text style={styles.section}>Lượt {miniStep+1}/4 · Tô phân số</Text><Text style={styles.paragraph}>Một hình được chia thành {miniTarget} phần bằng nhau. Con hãy chọn đúng {miniStep+1} phần được tô màu.</Text><View style={styles.fractionRow}>{Array.from({length:miniTarget},(_,i)=><Pressable key={i} onPress={()=>setMiniChoice(miniChoice===i+1?null:i+1)} style={[styles.fractionPiece,{backgroundColor:miniChoice!==null&&i<miniChoice?'#60a5fa':'#e7eee9'}]}><Text style={{color:'#12324a',fontSize:11}}>{i+1}</Text></Pressable>)}</View><Text style={styles.muted}>Chạm vào ô thứ N để tô N phần. Đang chọn: {miniChoice===null?'chưa chọn':`${miniChoice}/${miniTarget}`}</Text><Button disabled={miniChoice===null} onPress={miniNext}>Xác nhận →</Button></>}

    {['choose', 'gameChoose', 'testChoose'].includes(screen) && <>{header(screen === 'choose' ? 'Luyện tập' : screen === 'gameChoose' ? 'Chơi Toán' : 'Kiểm tra')}<Text style={styles.section}>1. Chọn chủ đề</Text>{TOPICS.map(t => <Pressable key={t.id} onPress={() => setTopic(t.id)} style={[styles.choice, topic === t.id && styles.choiceActive]}><Text style={styles.choiceText}>{t.icon}  {t.title}</Text><Text>{topic === t.id ? '✅' : '○'}</Text></Pressable>)}<Text style={styles.section}>2. Chọn độ khó</Text><View style={styles.levelRow}>{['Cơ bản', 'Khá', 'Nâng cao'].map(l => <Pressable key={l} onPress={() => setLevel(l)} style={[styles.levelButton, level === l && styles.levelActive]}><Text style={[styles.levelText, level === l && { color: '#fff' }]}>{l}</Text></Pressable>)}</View>{screen === 'testChoose' && <><Text style={styles.section}>3. Dạng đề</Text><View style={styles.levelRow}>{[{id:'topic',label:'Chủ đề'},{id:'mid',label:'Giữa kỳ'},{id:'final',label:'Cuối kỳ'},{id:'advanced',label:'Nâng cao'}].map(e=><Pressable key={e.id} onPress={()=>setExamKind(e.id)} style={[styles.levelButton,examKind===e.id&&styles.levelActive]}><Text style={[styles.levelText,examKind===e.id&&{color:'#fff'}]}>{e.label}</Text></Pressable>)}</View><Text style={styles.section}>4. Số câu hỏi</Text><View style={styles.levelRow}>{[10,20].map(n=><Pressable key={n} onPress={()=>setTestSize(n)} style={[styles.levelButton,testSize===n && styles.levelActive]}><Text style={[styles.levelText,testSize===n && {color:'#fff'}]}>{n} câu</Text></Pressable>)}</View><Text style={styles.muted}>Đề tự sinh theo nhóm chủ đề, không phải ma trận hoặc đề chính thức của bộ sách. Chế độ kiểm tra chỉ hiện lời giải sau khi nộp bài.</Text></>}<Text style={styles.footnote}>{screen === 'gameChoose' ? '5 câu / lượt. Nhận 0–3 sao tùy kết quả.' : '10 câu / lượt. Có giải thích sau mỗi câu.'}</Text><Button onPress={() => begin(screen === 'gameChoose' ? 'game' : screen === 'testChoose' ? 'test' : 'practice')}>Bắt đầu →</Button></>}

    {screen === 'quiz' && q && <>{header(mode === 'game' ? '🎮 Vượt ải' : mode === 'test' ? '🏆 Kiểm tra' : '✏️ Luyện tập', 'home')}<View style={styles.rowBetween}><Text style={styles.muted}>{mode==='test'&&examKind!=='topic'?'Đề tổng hợp':currentTopic.title} · {level}</Text><Text style={styles.progressText}>Câu {index + 1}/{questions.length}</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(index + 1) / questions.length * 100}%` }]} /></View><View style={styles.questionCard}><Text style={styles.questionLabel}>TÍNH VÀ ĐIỀN ĐÁP ÁN</Text><Text style={styles.question}>{q.question}</Text><MathIllustration question={q} height={illustrationHeight}/><TextInput style={[styles.answerInput, checked && { borderColor: isCorrect ? GREEN : '#d14b4b' }]} placeholder="Nhập đáp án" placeholderTextColor="#91a09a" keyboardType="number-pad" value={input} onChangeText={setInput} editable={!checked} returnKeyType="done" onSubmitEditing={checkAnswer} accessibilityLabel="Đáp án của con" /><Text style={styles.muted}>Có thể nhập số có hoặc không có dấu cách.</Text></View>{checked && mode !== 'test' && <View style={[styles.feedback, { backgroundColor: isCorrect ? '#e6f4ea' : '#fff0ed' }]}><Text style={styles.feedbackTitle}>{isCorrect ? '🎉 Chính xác! Giỏi lắm!' : `💡 Đáp án đúng: ${formatNum(q.answer)}`}</Text><Text style={styles.paragraph}>{q.explanation}</Text></View>}{!checked && mode !== 'test' && <View style={styles.card}><Button secondary small onPress={() => setHintLevel(v => Math.min(3, v + 1))}>💡 Gợi ý {hintLevel}/3</Button>{hintLevel > 0 && <Text style={styles.paragraph}>{hintLevel === 1 ? 'Đọc kỹ đề bài: con cần tìm giá trị nào? Hãy nhớ quy tắc đã học trong chủ đề này.' : hintLevel === 2 ? 'Hãy viết phép tính ra giấy và kiểm tra từng bước trước khi điền đáp án.' : q.explanation}</Text>}</View>}{!checked ? <Button disabled={!normalize(input)} onPress={checkAnswer}>{mode === 'test' ? 'Ghi nhận câu trả lời' : 'Kiểm tra đáp án'}</Button> : <Button onPress={nextQuestion}>{index + 1 === questions.length ? 'Xem kết quả →' : 'Câu tiếp theo →'}</Button>}<Text style={styles.footnote}>Nếu con làm sai, hãy đọc lời giải trước khi tiếp tục.</Text></>}

    {screen === 'result' && sessionDone && <>{header('Kết quả')}<View style={styles.resultCard}><Text style={styles.resultEmoji}>{sessionDone.correct / sessionDone.total >= .8 ? '🏆' : '🌈'}</Text><Text style={styles.section}>Con đã hoàn thành!</Text><Text style={styles.bigScore}>{sessionDone.score.toFixed(1).replace('.', ',')}/10</Text><Text style={styles.paragraph}>{sessionDone.correct}/{sessionDone.total} câu đúng</Text>{(mode === 'game'||mode==='mini'||mode==='shark'||mode==='drag') && <Text style={styles.heroStars}>+ {sessionDone.stars} ⭐</Text>}</View>{sessionDone.answers.filter(a => mode === 'test' || !a.correct).length > 0 && <><Text style={styles.section}>{mode === 'test' ? 'Đáp án và lời giải' : 'Câu cần ôn lại'}</Text>{sessionDone.answers.filter(a => mode === 'test' || !a.correct).map((a, i) => <View key={i} style={styles.card}><Text style={styles.rowTitle}>{a.question}</Text><Text style={styles.muted}>Con trả lời: {a.userAnswer} · Đúng: {formatNum(a.answer)} {a.correct ? '✅' : '❌'}</Text><Text style={styles.paragraph}>{a.explanation}</Text></View>)}</>}<Button onPress={() => mode==='mini'?beginMini():mode==='shark'?startShark():mode==='drag'?startMatch():mode==='review'?beginReview():begin(mode,topic,level)}>Làm lượt mới</Button><Button secondary onPress={() => setScreen('home')}>Về trang chủ</Button></>}

    {screen === 'history' && <>{header('Thành tích')}<View style={styles.stats}><View><Text style={styles.statNumber}>{progress.history.length}</Text><Text style={styles.muted}>Lượt học</Text></View><View><Text style={styles.statNumber}>{average}%</Text><Text style={styles.muted}>Tỷ lệ đúng</Text></View><View><Text style={styles.statNumber}>{progress.stars}</Text><Text style={styles.muted}>Ngôi sao</Text></View></View><Text style={styles.section}>Huy hiệu đã nhận</Text><Text style={styles.paragraph}>{(progress.badges||[]).length?(progress.badges||[]).map(b=>'🏅 '+b).join(' · '):'Hoàn thành các thử thách để nhận huy hiệu.'}</Text><Text style={styles.section}>Lịch sử gần đây</Text>{progress.history.length === 0 ? <Text style={styles.muted}>Chưa có kết quả. Hãy làm một lượt bài tập nhé!</Text> : progress.history.slice(0, 30).map(h => <Pressable key={h.id} style={styles.card} onPress={() => { setSessionDone(h); setScreen('pastResult'); }}><Text style={styles.rowTitle}>{TOPICS.find(t => t.id === h.topic)?.title || h.topic} · {h.level}</Text><Text style={styles.muted}>{new Date(h.date).toLocaleString('vi-VN')} · {(h.mode === 'game'||h.mode==='mini') ? 'Trò chơi' : h.mode === 'test' ? 'Kiểm tra' : h.mode==='shark'?'Vượt biển':h.mode==='drag'?'Kéo thả':h.mode==='steps'?'Toán nhiều bước':h.mode==='review'?'Ôn lỗi sai':'Luyện tập'}</Text><Text style={styles.progressText}>{h.correct}/{h.total} đúng · {h.score.toFixed(1).replace('.', ',')}/10</Text></Pressable>)}</>}

    {screen === 'pastResult' && sessionDone && <>{header('Chi tiết lượt học', 'history')}<Text style={styles.section}>{sessionDone.correct}/{sessionDone.total} đúng · {sessionDone.score.toFixed(1).replace('.', ',')}/10</Text>{sessionDone.answers.map((a, i) => <View key={i} style={styles.card}><Text style={styles.rowTitle}>{i + 1}. {a.question} {a.correct ? '✅' : '❌'}</Text><Text style={styles.muted}>Con trả lời: {a.userAnswer} · Đáp án: {formatNum(a.answer)}</Text><Text style={styles.paragraph}>{a.explanation}</Text></View>)}</>}

    {screen === 'backup' && <>{header('Sao lưu dữ liệu','parent')}
      <Text style={styles.section}>Sao lưu offline · V8</Text>
      <Text style={styles.muted}>Sao lưu lưu lịch sử, sao, huy hiệu và 120 thẻ. Chọn Chia sẻ để lưu nội dung JSON ra ứng dụng khác hoặc chạm giữ để sao chép. Không có đồng bộ đám mây tự động.</Text>
      <View style={styles.card}><Text style={styles.rowTitle}>Dữ liệu hiện có</Text>
        <Text style={styles.paragraph}>{progressSummary(progress).sessions} lượt học · {progressSummary(progress).answered} câu · {progress.stars} sao · {progressSummary(progress).lessons} thẻ</Text>
        <Button onPress={shareBackup}>Chia sẻ bản sao lưu JSON →</Button>
      </View>
      <Text selectable style={[styles.paragraph,{backgroundColor:'#fff',padding:12,borderRadius:12}]}>{backupText}</Text>
      <Text style={styles.section}>Khôi phục và bảo vệ dữ liệu</Text>
      <Text style={styles.muted}>Dán bản sao lưu V6.5/V7/V8. Ứng dụng kiểm tra trước khi ghi đè và tạo bản dự phòng trong máy.</Text>
      <TextInput multiline style={[styles.answerInput,{minHeight:110,textAlignVertical:'top'}]} placeholder="Dán toàn bộ JSON sao lưu vào đây" value={restoreText} onChangeText={s=>{setRestoreText(s);setRestoreSummary(null);setRestoreConfirmed(false);}}/>
      <Button secondary disabled={!restoreText.trim()} onPress={previewRestore}>Kiểm tra bản sao lưu</Button>
      {restoreSummary&&<View style={styles.card}><Text style={styles.rowTitle}>Bản sao lưu sắp khôi phục</Text>
        <Text style={styles.paragraph}>{restoreSummary.sessions} lượt · {restoreSummary.answered} câu · {restoreSummary.stars} sao · {restoreSummary.lessons} thẻ</Text>
        <Pressable style={styles.choice} onPress={()=>setRestoreConfirmed(v=>!v)}><Text style={styles.choiceText}>{restoreConfirmed?'☑':'□'} Tôi đồng ý thay thế dữ liệu hiện tại sau khi đã xem các chỉ số</Text></Pressable>
        <Button disabled={!restoreConfirmed} onPress={restoreBackup}>Xác nhận khôi phục →</Button>
      </View>}
      <Button secondary onPress={loadPreRestore}>Nạp bản dự phòng trước lần khôi phục gần nhất</Button>
      <Text style={styles.footnote}>Dữ liệu lưu tại thiết bị/trình duyệt đang dùng. Cài APK mới không tự chuyển dữ liệu từ Snack sang ứng dụng Android; hãy sao lưu trên Snack rồi nhập vào APK. Cài lại hoặc xóa dữ liệu ứng dụng sẽ làm mất dữ liệu chưa xuất ra ngoài.</Text>
    </>}
    {screen === 'parent' && <>{header('Góc bố mẹ')}<Text style={styles.section}>Báo cáo học tập</Text><View style={styles.stats}><View><Text style={styles.statNumber}>{totalAnswered}</Text><Text style={styles.muted}>Câu đã làm</Text></View><View><Text style={styles.statNumber}>{average}%</Text><Text style={styles.muted}>Tỷ lệ đúng</Text></View><View><Text style={styles.statNumber}>{progress.history.length}</Text><Text style={styles.muted}>Lượt học</Text></View></View><Text style={styles.section}>Độ khó gợi ý cho buổi tiếp theo</Text>{TOPICS.map(t=><Text key={t.id} style={styles.muted}>{t.icon} {t.title}: {recommendedLevel(progress.history,t.id)} ({topicStats(progress.history,t.id).total} câu đã ghi nhận)</Text>)}<Text style={styles.section}>Kết quả theo chủ đề</Text>{TOPICS.map(t => { const st=topicStats(progress.history,t.id); const total=st.total; const correct=st.correct; const pct = total ? Math.round(correct / total * 100) : 0; return <View key={t.id} style={styles.card}><View style={styles.rowBetween}><Text style={styles.rowTitle}>{t.icon} {t.title}</Text><Text style={styles.progressText}>{total ? pct + '%' : 'Chưa học'}</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${pct}%` }]} /></View><Text style={styles.muted}>{correct}/{total} câu đúng</Text></View>; })}<Text style={styles.footnote}>Bản Pro thử nghiệm: báo cáo trên cùng điện thoại; chưa có mã PIN phụ huynh; có thể xuất/nhập bản sao lưu JSON thủ công ở cuối màn này.</Text><Button secondary onPress={() => setScreen('reviewPlan')}>Ôn tập cá nhân hóa và xu hướng</Button><Button secondary onPress={() => setScreen('coach')}>Xem gợi ý gia sư offline</Button><Button secondary onPress={() => setScreen('history')}>Xem lịch sử chi tiết</Button><Button secondary onPress={generateBackup}>Sao lưu / khôi phục dữ liệu</Button></>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  chaseLabels:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:-7,marginBottom:-6},chaseLabel:{fontSize:10,fontWeight:'900',color:'#287A91',letterSpacing:.4},missionResultNote:{color:'#376455',fontSize:12,fontWeight:'700',marginTop:5},adventureIntro:{backgroundColor:'#E6F8FF',padding:12,borderRadius:24,gap:10},adventureEyebrow:{color:'#398A9E',fontWeight:'900',fontSize:10,letterSpacing:1.3},adventureHeadline:{fontSize:23,fontWeight:'900',lineHeight:30,color:'#15435B'},adventureDesc:{fontSize:13,lineHeight:20,color:'#27536A'},motionToggle:{padding:15,backgroundColor:'#FFF',borderRadius:12,borderWidth:1,borderColor:'#DDECE4',flexDirection:'row',justifyContent:'space-between'},oceanTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:2},oceanStage:{color:'#193F50',fontSize:22,fontWeight:'900',marginTop:3},timerPill:{backgroundColor:'#D8F6E7',borderRadius:17,paddingHorizontal:16,paddingVertical:9,minWidth:66,alignItems:'center'},timerText:{color:'#167858',fontWeight:'900',fontSize:22},oceanProgress:{height:11,borderRadius:9,backgroundColor:'#E0EDEA',overflow:'hidden'},oceanProgressFill:{height:'100%',borderRadius:9},sceneCaption:{backgroundColor:'#DFF5FF',borderRadius:12,padding:12},sceneCaptionText:{fontWeight:'700',fontSize:13,lineHeight:19,color:'#17617D',textAlign:'center'},missionCard:{padding:20,backgroundColor:'#FFF',borderRadius:23,borderWidth:1,borderColor:'#D5E9E4',gap:15,shadowColor:'#173F46',shadowOpacity:.07,shadowRadius:12,elevation:2},missionKicker:{fontWeight:'900',color:'#298A78',letterSpacing:1.4,fontSize:11},missionQuestion:{fontSize:29,lineHeight:39,fontWeight:'900',color:'#203F38'},missionInput:{borderColor:'#BEE2D2',borderWidth:2,borderRadius:15,padding:15,fontSize:21,fontWeight:'800',color:'#203F38',backgroundColor:'#FBFFFC'},missionFeedback:{padding:17,borderRadius:18,gap:8},missionFeedbackTitle:{fontSize:18,fontWeight:'900',color:'#215643'},
  sea:{backgroundColor:'#dff5ff',borderRadius:18,padding:18,gap:8},seaTitle:{fontSize:32,textAlign:'center'},
  fractionRow:{flexDirection:'row',gap:4,marginVertical:12},fractionPiece:{flex:1,height:52,borderWidth:1,borderColor:'#9dbcb0',borderRadius:5,justifyContent:'center',alignItems:'center'},geometryShape:{height:90,borderWidth:3,borderColor:'#60a5fa',marginHorizontal:35,justifyContent:'center',alignItems:'center',backgroundColor:'#eff6ff'},
  root: { flex: 1, backgroundColor: '#f7faf8' }, page: { padding: 18, paddingBottom: 44, maxWidth: 650, width: '100%', alignSelf: 'center', gap: 13 },
  brand: { fontSize: 27, fontWeight: '900', color: '#176b4b', marginTop: 8 }, muted: { color: '#64746e', fontSize: 13, lineHeight: 20 },
  hero: { backgroundColor: '#dff4e6', padding: 20, borderRadius: 22, marginVertical: 8 }, heroTitle: { fontSize: 21, fontWeight: '800', color: '#185b3b' }, heroText: { color: '#326b50', marginTop: 6 }, heroStars: { fontWeight: '800', color: '#91640d', marginTop: 14, fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, tile: { width: '48%', minHeight: 142, borderRadius: 18, padding: 17, flexGrow: 1 }, tileIcon: { fontSize: 29 }, tileTitle: { color: '#21382d', fontSize: 17, fontWeight: '800', marginTop: 10 }, tileSub: { color: '#536d61', fontSize: 12, marginTop: 3 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 4 }, back: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#e7eee9', alignItems: 'center', justifyContent: 'center' }, backText: { color: '#226948', fontSize: 28, lineHeight: 31 }, headerText: { fontSize: 22, fontWeight: '800', color: '#214b37' },
  section: { fontSize: 19, fontWeight: '800', color: '#253e31', marginTop: 10 }, topicRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 17, gap: 12 }, topicIcon: { fontSize: 31 }, rowTitle: { fontSize: 16, fontWeight: '750', color: '#253e31' }, chevron: { fontSize: 30, color: '#5c7568' },
  lessonTab: { backgroundColor: '#e7eee9', borderRadius: 12, padding: 12 }, lessonTabActive: { backgroundColor: GREEN }, lessonTabText: { color: '#28533b', fontWeight: '700' }, card: { backgroundColor: '#fff', padding: 17, borderRadius: 17, gap: 9, borderWidth: 1, borderColor: '#e6eee9' }, paragraph: { color: '#344c3e', lineHeight: 23, fontSize: 15 }, example: { backgroundColor: '#f0f8ed', borderRadius: 12, padding: 14, marginTop: 8 }, exampleTitle: { fontWeight: '800', color: '#216a43', marginBottom: 6 },
  button: { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 15, alignItems: 'center', marginTop: 4 }, buttonSecondary: { backgroundColor: '#e7f3e9', borderWidth: 1, borderColor: '#b5dbc1' }, buttonText: { color: 'white', fontWeight: '800', fontSize: 16 },
  choice: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2eae4', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, choiceActive: { borderColor: GREEN, backgroundColor: '#e8f5ea' }, choiceText: { fontWeight: '700', fontSize: 15, color: '#263f32' }, levelRow: { flexDirection: 'row', gap: 8 }, levelButton: { flex: 1, alignItems: 'center', paddingVertical: 13, backgroundColor: '#e4ece6', borderRadius: 12 }, levelActive: { backgroundColor: GREEN }, levelText: { color: '#28533b', fontWeight: '800' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, progressText: { color: GREEN, fontWeight: '800', fontSize: 14 }, progressTrack: { height: 9, borderRadius: 6, backgroundColor: '#e4ece5', overflow: 'hidden', marginVertical: 8 }, progressFill: { backgroundColor: '#2ca66b', height: '100%', borderRadius: 6 },
  questionCard: { padding: 19, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#dcebe0', gap: 15 }, questionLabel: { color: '#5f806f', fontWeight: '800', fontSize: 12, letterSpacing: 1 }, question: { fontSize: 25, fontWeight: '900', color: '#1d4530', lineHeight: 36 }, answerInput: { borderWidth: 2, borderColor: '#c3decc', borderRadius: 13, padding: 14, fontSize: 21, fontWeight: '700', color: '#203d2b', backgroundColor: '#fafffb' }, feedback: { borderRadius: 15, padding: 17, gap: 9 }, feedbackTitle: { color: '#225c42', fontWeight: '900', fontSize: 17 },
  resultCard: { alignItems: 'center', backgroundColor: '#e7f5e9', borderRadius: 22, padding: 25, gap: 8 }, resultEmoji: { fontSize: 54 }, bigScore: { fontSize: 45, fontWeight: '900', color: GREEN }, stats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#e5f5e9', borderRadius: 18, padding: 19, marginVertical: 8 }, statNumber: { fontWeight: '900', fontSize: 24, color: '#176b4b', textAlign: 'center' }, footnote: { color: '#77897e', fontSize: 12, lineHeight: 19, marginTop: 8 },
});