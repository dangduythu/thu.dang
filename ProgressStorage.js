// MathKid V8 – offline progress migration and recoverable local backup.
// No network/API. Keep existing storage key: mathkid4_v1_progress.
export const PROGRESS_KEY = 'mathkid4_v1_progress';
export const PRE_RESTORE_KEY = 'mathkid4_v8_before_restore';
export const BACKUP_FORMAT = 'mathkid4-backup';
const isObject = v => !!v && typeof v === 'object' && !Array.isArray(v);
const list = v => Array.isArray(v) ? v : [];
const integer = v => Number.isFinite(Number(v)) ? Math.max(0,Number(v)) : 0;
export function normalizeProgress(raw) {
  const p = isObject(raw) ? raw : {};
  // Preserve future/unknown metadata as well as all existing V5–V7.5 fields.
  return {...p,
    history:list(p.history), seen:list(p.seen), stars:integer(p.stars),
    badges:list(p.badges), stages:isObject(p.stages)?p.stages:{},
    lessonsDone:list(p.lessonsDone), currentLesson:typeof p.currentLesson==='string'?p.currentLesson:null,
    lessonChecks:isObject(p.lessonChecks)?p.lessonChecks:{},
    book:typeof p.book==='string'?p.book:'general',
    starSpent:integer(p.starSpent), ownedRewards:list(p.ownedRewards).filter(id=>typeof id==='string'),
    equippedReward:typeof p.equippedReward==='string'?p.equippedReward:null
  };
}
export function makeBackup(progress, book) {
  return {format:BACKUP_FORMAT,version:2,createdAt:new Date().toISOString(),
    progress:normalizeProgress({...progress,book:book || progress?.book || 'general'})};
}
export function parseBackup(text) {
  if(typeof text!=='string' || text.length>20_000_000)throw Error('Dữ liệu sao lưu trống hoặc quá lớn');
  const envelope=JSON.parse(text);
  if(!isObject(envelope)||envelope.format!==BACKUP_FORMAT||![1,2].includes(envelope.version))
    throw Error('Không phải bản sao lưu MathKid được hỗ trợ (V1/V2).');
  const p=envelope.progress;
  if(!isObject(p)||!Array.isArray(p.history)||!Array.isArray(p.seen))
    throw Error('Bản sao lưu thiếu lịch sử hoặc danh sách câu đã làm.');
  return normalizeProgress(p);
}
export function progressSummary(progress) {
  const p=normalizeProgress(progress);
  return {sessions:p.history.length,answered:p.history.reduce((n,h)=>n+(Number(h?.total)||0),0),
    stars:p.stars,lessons:p.lessonsDone.length};
}
