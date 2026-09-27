// V8.4: parent-fulfilled real-world reward requests (not automatic purchases).
// Existing V8.1 virtual rewards and spent stars remain in backups unchanged.
export const REAL_REWARDS=Object.freeze([
  {id:'icecream',icon:'🍦',title:'Một cây kem',price:30,description:'Phiếu đề nghị bố mẹ thưởng 1 cây kem.'},
  {id:'ballpit',icon:'🎈',title:'Chơi nhà bóng 1 lần',price:200,description:'Phiếu đề nghị bố mẹ cho chơi nhà bóng một lần.'}
]);
export const getRealReward=id=>REAL_REWARDS.find(r=>r.id===id)||null;
export const remainingStars=p=>Math.max(0,Math.floor(Number(p?.stars)||0)-Math.max(0,Math.floor(Number(p?.starSpent)||0)));
export function redeemRealReward(progress,id,requestId,at=new Date().toISOString()){
  const item=getRealReward(id);
  if(!item)return {ok:false,reason:'unknown',progress};
  if(typeof requestId!=='string'||requestId.length<8)return {ok:false,reason:'invalid-id',progress};
  const existing=Array.isArray(progress?.redemptions)?progress.redemptions:[];
  if(existing.some(x=>x.id===requestId))return {ok:false,reason:'duplicate',progress};
  if(remainingStars(progress)<item.price)return {ok:false,reason:'insufficient',progress};
  const record={id:requestId,rewardId:id,title:item.title,price:item.price,requestedAt:at,status:'pending'};
  return {ok:true,record,progress:{...progress,starSpent:Math.max(0,Math.floor(Number(progress?.starSpent)||0))+item.price,
    redemptions:[record,...existing]}};
}
export function markRewardDelivered(progress,requestId,at=new Date().toISOString()){
  const records=Array.isArray(progress?.redemptions)?progress.redemptions:[];
  const target=records.find(r=>r.id===requestId);
  if(!target||target.status!=='pending')return {ok:false,progress};
  return {ok:true,progress:{...progress,redemptions:records.map(r=>r.id===requestId?{...r,status:'delivered',deliveredAt:at}:r)}};
}
