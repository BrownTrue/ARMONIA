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

export function deriveTodayDashboard(appointments:Appointment[],sessions:Session[],date:string,currentTime:string){
 const partition=partitionTodayAppointments(appointments,sessions,date);
 const overdue=partition.pending.filter(appointment=>appointment.time<currentTime);
 const upcoming=partition.pending.filter(appointment=>appointment.time>=currentTime);
 return {
  ...partition,
  next:upcoming[0],
  upcoming,
  overdue,
  cancelled:appointments.filter(appointment=>appointment.date===date&&appointment.type==="cancelled").sort((a,b)=>a.time.localeCompare(b.time)),
 };
}

export function currentRomeTime(now=new Date()){
 return new Intl.DateTimeFormat("it-IT",{timeZone:"Europe/Rome",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(now);
}
