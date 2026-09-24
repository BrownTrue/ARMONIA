const FLUSH_LOCK_NAME="armonia-google-calendar-flush-v1";
const MUTATION_LOCK_NAME="armonia-google-calendar-mutation-v1";
const LEASE_MS=15_000;

type LockManagerLike={request:<T>(name:string,options:{mode:"exclusive"},callback:()=>Promise<T>)=>Promise<T>};
type StorageLike=Pick<Storage,"getItem"|"setItem"|"removeItem">;

const wait=(milliseconds:number)=>new Promise(resolve=>setTimeout(resolve,milliseconds));

async function withLeaseFallback<T>(leaseKey:string,task:()=>Promise<T>,storage:StorageLike){
 const owner=crypto.randomUUID();
 while(true){
  const now=Date.now();
  let lease:{owner:string;expiresAt:number}|null=null;
  try{lease=JSON.parse(storage.getItem(leaseKey)||"null") as {owner:string;expiresAt:number}|null}catch{}
  if(!lease||lease.expiresAt<=now){
   storage.setItem(leaseKey,JSON.stringify({owner,expiresAt:now+LEASE_MS}));
   await wait(20+Math.floor(Math.random()*30));
   try{lease=JSON.parse(storage.getItem(leaseKey)||"null") as {owner:string;expiresAt:number}|null}catch{lease=null}
   if(lease?.owner===owner)break;
  }
  await wait(75);
 }
 const heartbeat=setInterval(()=>{try{const lease=JSON.parse(storage.getItem(leaseKey)||"null") as {owner?:string}|null;if(lease?.owner===owner)storage.setItem(leaseKey,JSON.stringify({owner,expiresAt:Date.now()+LEASE_MS}))}catch{}},LEASE_MS/3);
 try{return await task()}finally{clearInterval(heartbeat);try{const lease=JSON.parse(storage.getItem(leaseKey)||"null") as {owner?:string}|null;if(lease?.owner===owner)storage.removeItem(leaseKey)}catch{}}
}

async function withLock<T>(name:string,task:()=>Promise<T>,environment?:{locks?:LockManagerLike;storage?:StorageLike}){
 const locks=environment?.locks??(typeof navigator!=="undefined"?navigator.locks as unknown as LockManagerLike:undefined);
 if(locks)return locks.request(name,{mode:"exclusive"},task);
 const target=environment?.storage??(typeof window!=="undefined"?window.localStorage:undefined);
 if(!target)return task();
 return withLeaseFallback(`${name}-lease`,task,target);
}

export const withGoogleFlushLock=<T>(task:()=>Promise<T>,environment?:{locks?:LockManagerLike;storage?:StorageLike})=>withLock(FLUSH_LOCK_NAME,task,environment);
export const withGoogleQueueMutationLock=<T>(task:()=>Promise<T>,environment?:{locks?:LockManagerLike;storage?:StorageLike})=>withLock(MUTATION_LOCK_NAME,task,environment);
