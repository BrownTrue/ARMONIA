import type {Appointment,Session} from "./types";

export function partitionTodayAppointments(appointments:Appointment[],sessions:Session[],date:string){
 const completedIds=new Set(sessions.map(session=>session.appointmentId).filter((id):id is string=>Boolean(id)));
 const todayAppointments=appointments.filter(appointment=>appointment.date===date&&appointment.type!=="cancelled").sort((a,b)=>a.time.localeCompare(b.time));
 return {
  all:todayAppointments,
  pending:todayAppointments.filter(appointment=>!completedIds.has(appointment.id)),
  completed:todayAppointments.filter(appointment=>completedIds.has(appointment.id)),
 };
}
