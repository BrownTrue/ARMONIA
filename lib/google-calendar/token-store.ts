import "server-only";
import {createCipheriv,createDecipheriv,createHash,randomBytes} from "crypto";
import {mkdir,readFile,rename,rm,writeFile} from "fs/promises";
import path from "path";
import {supabaseServiceClient} from "@/lib/supabase/server";

export type GoogleNameFormat="first_initial"|"full"|"initials";
export type GoogleTokenRecord={accessToken:string;refreshToken:string;expiresAt:number;calendarId?:string;nameFormat:GoogleNameFormat;reminderMinutes:number;syncEnabled:boolean};
export interface GoogleTokenStore{load(userId:string):Promise<GoogleTokenRecord|null>;save(userId:string,value:GoogleTokenRecord):Promise<void>;clear(userId:string):Promise<void>}
const defaults={nameFormat:"first_initial" as const,reminderMinutes:30,syncEnabled:true};
const key=()=>{const secret=process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;if(!secret)throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY non configurata");return createHash("sha256").update(secret).digest()};
const encrypt=(value:string)=>{const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(),iv),data=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);return JSON.stringify({v:1,iv:iv.toString("base64"),tag:cipher.getAuthTag().toString("base64"),data:data.toString("base64")})};
const decrypt=(value:string)=>{const packed=JSON.parse(value) as {iv:string;tag:string;data:string},decipher=createDecipheriv("aes-256-gcm",key(),Buffer.from(packed.iv,"base64"));decipher.setAuthTag(Buffer.from(packed.tag,"base64"));return Buffer.concat([decipher.update(Buffer.from(packed.data,"base64")),decipher.final()]).toString("utf8")};

class EncryptedLocalTokenStore implements GoogleTokenStore{
 private readonly directory=path.join(process.cwd(),".armonia-local");private readonly file=path.join(this.directory,"google-calendar-token.enc");
 async load(_userId:string){try{const packed=JSON.parse(await readFile(this.file,"utf8")) as {iv:string;tag:string;data:string},decipher=createDecipheriv("aes-256-gcm",key(),Buffer.from(packed.iv,"base64"));decipher.setAuthTag(Buffer.from(packed.tag,"base64"));const clear=Buffer.concat([decipher.update(Buffer.from(packed.data,"base64")),decipher.final()]);return {...defaults,...JSON.parse(clear.toString("utf8"))} as GoogleTokenRecord}catch(error){if((error as NodeJS.ErrnoException).code==="ENOENT")return null;throw error}}
 async save(_userId:string,value:GoogleTokenRecord){await mkdir(this.directory,{recursive:true});const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(),iv),encrypted=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]),payload=JSON.stringify({iv:iv.toString("base64"),tag:cipher.getAuthTag().toString("base64"),data:encrypted.toString("base64")}),temporary=`${this.file}.tmp`;await writeFile(temporary,payload,{mode:0o600});await rename(temporary,this.file)}
 async clear(_userId:string){await rm(this.file,{force:true})}
}

class SupabaseGoogleTokenStore implements GoogleTokenStore{
 async load(userId:string){const {data,error}=await supabaseServiceClient().from("google_calendar_connections").select("access_token_ciphertext,refresh_token_ciphertext,token_expires_at,calendar_id,name_format,reminder_minutes,sync_enabled").eq("user_id",userId).maybeSingle();if(error)throw error;if(!data)return null;return {accessToken:decrypt(data.access_token_ciphertext),refreshToken:decrypt(data.refresh_token_ciphertext),expiresAt:new Date(data.token_expires_at).getTime(),calendarId:data.calendar_id,nameFormat:data.name_format as GoogleNameFormat,reminderMinutes:data.reminder_minutes,syncEnabled:data.sync_enabled}}
 async save(userId:string,value:GoogleTokenRecord){if(!value.calendarId)throw new Error("Calendar ID mancante");const {error}=await supabaseServiceClient().from("google_calendar_connections").upsert({user_id:userId,access_token_ciphertext:encrypt(value.accessToken),refresh_token_ciphertext:encrypt(value.refreshToken),token_expires_at:new Date(value.expiresAt).toISOString(),calendar_id:value.calendarId,name_format:value.nameFormat,reminder_minutes:value.reminderMinutes,sync_enabled:value.syncEnabled,updated_at:new Date().toISOString()});if(error)throw error}
 async clear(userId:string){const {error}=await supabaseServiceClient().from("google_calendar_connections").delete().eq("user_id",userId);if(error)throw error}
}

const localStore=new EncryptedLocalTokenStore(),cloudStore=new SupabaseGoogleTokenStore();
export const googleTokenStore:GoogleTokenStore={load:userId=>process.env.NEXT_PUBLIC_DATA_MODE==="local"?localStore.load(userId):cloudStore.load(userId),save:(userId,value)=>process.env.NEXT_PUBLIC_DATA_MODE==="local"?localStore.save(userId,value):cloudStore.save(userId,value),clear:userId=>process.env.NEXT_PUBLIC_DATA_MODE==="local"?localStore.clear(userId):cloudStore.clear(userId)};
