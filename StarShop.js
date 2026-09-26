// V8.1 virtual-only rewards: no purchase, money, ads or randomized prizes.
export const STAR_REWARDS = Object.freeze([
 {id:'explorer',icon:'🧭',title:'Nhà thám hiểm',price:3,description:'Huy hiệu la bàn cạnh tên con.'},
 {id:'astronaut',icon:'🚀',title:'Phi hành gia',price:5,description:'Huy hiệu tên lửa cho hành trình Toán học.'},
 {id:'dinosaur',icon:'🦕',title:'Bạn khủng long',price:8,description:'Người bạn khủng long xuất hiện trên trang chủ.'},
 {id:'wizard',icon:'🧙',title:'Pháp sư toán học',price:12,description:'Huy hiệu phép thuật do con mở khóa.'},
 {id:'dragon',icon:'🐉',title:'Rồng dũng cảm',price:16,description:'Bạn rồng đồng hành cùng con.'},
 {id:'castle',icon:'🏰',title:'Chủ nhân lâu đài',price:24,description:'Huy hiệu lâu đài cho bộ sưu tập.'}
]);
export function availableStars(p) {
  const earned=Number.isFinite(Number(p?.stars))?Math.max(0,Math.floor(Number(p.stars))):0;
  const spent=Number.isFinite(Number(p?.starSpent))?Math.max(0,Math.floor(Number(p.starSpent))):0;
  return Math.max(0,earned-spent);
}
export function getReward(id) { return STAR_REWARDS.find(x=>x.id===id)||null; }
export function purchaseReward(p,id) {
  const reward=getReward(id);
  if(!reward) return {ok:false,reason:'not-found',progress:p};
  const owned=Array.isArray(p?.ownedRewards)?p.ownedRewards:[];
  if(owned.includes(id))return {ok:false,reason:'owned',progress:p};
  if(availableStars(p)<reward.price)return {ok:false,reason:'insufficient',progress:p};
  return {ok:true,reward,progress:{...p,starSpent:(Number(p.starSpent)||0)+reward.price,
    ownedRewards:[...owned,id],equippedReward:id}};
}
export function equipReward(p,id) {
  if(!getReward(id)||!Array.isArray(p?.ownedRewards)||!p.ownedRewards.includes(id))
    return {ok:false,progress:p};
  return {ok:true,progress:{...p,equippedReward:id}};
}
