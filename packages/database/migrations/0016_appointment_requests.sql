-- Lets clients request an appointment slot from the portal instead of only
-- ever being scheduled by the dietitian.
alter type appointment_status add value 'requested';

create policy client_appointments_insert on appointments
  for insert
  with check (client_id = public.current_client_id());
