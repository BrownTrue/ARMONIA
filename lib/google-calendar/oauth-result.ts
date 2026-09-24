export type GoogleOAuthResult="connected"|"reconnected";

export function createGoogleOAuthResultConsumer(){
 let consumed=false;
 return (value:string|null):GoogleOAuthResult|null=>{
  if(consumed||(value!=="connected"&&value!=="reconnected"))return null;
  consumed=true;
  return value;
 };
}
