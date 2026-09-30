-- E3A hotfix: make every economic document line mutation policy explicitly
-- correlate the line owner, patient and document with its draft parent.

begin;

alter policy "economic document lines insert draft own"
  on public.economic_document_lines
  with check (
    economic_document_lines.user_id = auth.uid()
    and exists (
      select 1
      from public.economic_documents d
      where d.id = economic_document_lines.document_id
        and d.user_id = economic_document_lines.user_id
        and d.patient_id = economic_document_lines.patient_id
        and d.status = 'draft'
    )
  );

alter policy "economic document lines update draft own"
  on public.economic_document_lines
  using (
    economic_document_lines.user_id = auth.uid()
    and exists (
      select 1
      from public.economic_documents d
      where d.id = economic_document_lines.document_id
        and d.user_id = economic_document_lines.user_id
        and d.patient_id = economic_document_lines.patient_id
        and d.status = 'draft'
    )
  )
  with check (
    economic_document_lines.user_id = auth.uid()
    and exists (
      select 1
      from public.economic_documents d
      where d.id = economic_document_lines.document_id
        and d.user_id = economic_document_lines.user_id
        and d.patient_id = economic_document_lines.patient_id
        and d.status = 'draft'
    )
  );

alter policy "economic document lines delete draft own"
  on public.economic_document_lines
  using (
    economic_document_lines.user_id = auth.uid()
    and exists (
      select 1
      from public.economic_documents d
      where d.id = economic_document_lines.document_id
        and d.user_id = economic_document_lines.user_id
        and d.patient_id = economic_document_lines.patient_id
        and d.status = 'draft'
    )
  );

commit;
