import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appointmentLocationColor, calendarEventColors, compactPatientName, FALLBACK_APPOINTMENT_COLOR, layoutOverlappingAppointments, monthDayAppointments } from "./calendar-visual.ts";

const appointment=(id,time,duration=45,extra={})=>({id,patientId:"patient-1",date:"2026-10-01",time,duration,type:"regular",notes:"",createdAt:"2026-09-01T00:00:00Z",...extra});
const location=(isActive=true)=>({id:"location-1",color:"#9B8CC4",isActive});

test("usa fallback per appuntamenti legacy o senza sede",()=>assert.equal(appointmentLocationColor(appointment("a","09:00"),[]),FALLBACK_APPOINTMENT_COLOR));
test("usa il colore della sede attiva o inattiva tramite locationId",()=>{
  const value={...appointment("a","09:00"),locationId:"location-1"};
  assert.equal(appointmentLocationColor(value,[location()]),"#9B8CC4");
  assert.equal(appointmentLocationColor(value,[location(false)]),"#9B8CC4");
});
test("genera tint trasparente stabile e testo ad alto contrasto",()=>assert.deepEqual(calendarEventColors("#70A6C2"),{accent:"#70A6C2",background:"#70A6C218",hover:"#70A6C22A",text:"#24322B"}));

test("eventi non sovrapposti riusano una sola colonna",()=>assert.deepEqual(layoutOverlappingAppointments([appointment("a","09:00",30),appointment("b","09:30",30)]).map(x=>[x.column,x.columnCount]),[[0,1],[0,1]]));
test("due eventi allo stesso orario sono affiancati",()=>assert.deepEqual(layoutOverlappingAppointments([appointment("a","09:00"),appointment("b","09:00")]).map(x=>[x.column,x.columnCount]),[[0,2],[1,2]]));
test("overlap parziale usa due colonne",()=>assert.deepEqual(layoutOverlappingAppointments([appointment("a","09:00",60),appointment("b","09:30",60)]).map(x=>[x.column,x.columnCount]),[[0,2],[1,2]]));
test("una catena di overlap resta nello stesso gruppo",()=>assert.deepEqual(layoutOverlappingAppointments([appointment("a","09:00",60),appointment("b","09:30",60),appointment("c","10:00",60)]).map(x=>x.columnCount),[2,2,2]));
test("tre eventi simultanei usano tre colonne",()=>assert.deepEqual(layoutOverlappingAppointments([appointment("a","09:00"),appointment("b","09:00"),appointment("c","09:00")]).map(x=>x.column),[0,1,2]));
test("il layout è deterministico e non muta l'input",()=>{const input=[appointment("b","10:00"),appointment("a","09:00")],before=structuredClone(input);assert.deepEqual(layoutOverlappingAppointments(input).map(x=>x.appointment.id),["a","b"]);assert.deepEqual(input,before);});
test("Month mobile ordina, limita gli indicatori e conserva tutti gli eventi",()=>{const input=[appointment("d","11:00"),appointment("a","08:00"),appointment("c","10:00"),appointment("b","09:00")];const result=monthDayAppointments(input,"2026-10-01");assert.deepEqual(result.visible.map(x=>x.id),["a","b","c"]);assert.equal(result.hiddenCount,1);assert.deepEqual(result.all.map(x=>x.id),["a","b","c","d"]);});
test("Month mobile seleziona soltanto gli eventi della data richiesta",()=>{const other={...appointment("x","07:00"),date:"2026-10-02"};assert.deepEqual(monthDayAppointments([other,appointment("a","09:00")],"2026-10-01").all.map(x=>x.id),["a"]);});
test("la presentazione molto compatta abbrevia in modo sensato",()=>{assert.equal(compactPatientName("Mario Rossi",true),"Mario R.");assert.equal(compactPatientName("Mario Rossi",false),"Mario Rossi");assert.equal(compactPatientName("Mario",true),"Mario");});
test("la card rende cancellazione e sede comprensibili senza dipendere dal colore",()=>{const source=readFileSync(new URL("../components/calendar-event-card.tsx",import.meta.url),"utf8");assert.match(source,/Annullato/);assert.match(source,/sede \$\{location\.name\}/);assert.doesNotMatch(source,/effectivePriceCents|Prezzo/);});
