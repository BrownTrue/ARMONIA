import {NextRequest,NextResponse} from "next/server";
import {authenticatedUserId} from "@/lib/supabase/server";
import {googleTokenStore,type GoogleNameFormat} from "@/lib/google-calendar/token-store";

export async function PATCH(request:NextRequest){
 try{
  const userId=await authenticatedUserId(),record=await googleTokenStore.load(userId);
  if(!record)return NextResponse.json({error:"Google Calendar non collegato"},{status:404});
  const value=await request.json() as {nameFormat?:GoogleNameFormat;reminderMinutes?:number;syncEnabled?:boolean};
  if(value.nameFormat&&!['first_initial','full','initials'].includes(value.nameFormat))return NextResponse.json({error:"Formato titolo non valido"},{status:400});
  if(value.reminderMinutes!==undefined&&(!Number.isInteger(value.reminderMinutes)||value.reminderMinutes<0||value.reminderMinutes>40320))return NextResponse.json({error:"Promemoria non valido"},{status:400});
  await googleTokenStore.save(userId,{...record,...value});
  return NextResponse.json({ok:true});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Salvataggio non riuscito"},{status:500})}
}
