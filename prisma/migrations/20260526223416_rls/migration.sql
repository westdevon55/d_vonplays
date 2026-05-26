-- Row-Level Security: hard tenant isolation at the DB layer.
-- Each request runs queries inside a transaction that does
--   SELECT set_config('app.current_org', '<orgId>', true);
-- Policies match the row's `organizationId` (or parent's) against that value.
-- When unset, current_setting(..., true) returns NULL → all rows hidden.
--
-- The application connects as `cms_app` (NON-superuser) so policies apply.
-- The seed script connects as `postgres` (superuser) to bypass.

-- Helper: returns the current org id from session, NULL if unset.
CREATE OR REPLACE FUNCTION current_org_id() RETURNS text
LANGUAGE sql STABLE
AS $$ SELECT current_setting('app.current_org', true) $$;

-- ---------------------------------------------------------------------------
-- Tables with direct `organizationId`
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'Organization','Subscription','Membership','Invitation','AuditLog',
    'PeopleCategory','Family','Person','CustomField',
    'GroupCategory','Group',
    'ServiceType','Service','Song','Position',
    'Fund','Donation','Pledge','RecurringGift','GivingBatch',
    'Event','CheckinSession',
    'MessageTemplate','Campaign','Form'
  ];
  org_column text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);

    IF t = 'Organization' THEN
      org_column := 'id';
    ELSE
      org_column := '"organizationId"';
    END IF;

    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (%s = current_org_id()) WITH CHECK (%s = current_org_id())',
      t, org_column, org_column
    );
  END LOOP;
END$$;

-- ---------------------------------------------------------------------------
-- Child tables — isolation by parent's organizationId
-- ---------------------------------------------------------------------------

-- CustomFieldValue — via CustomField
ALTER TABLE "CustomFieldValue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomFieldValue" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "CustomFieldValue"
  USING (EXISTS (
    SELECT 1 FROM "CustomField" cf WHERE cf.id = "customFieldId"
      AND cf."organizationId" = current_org_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "CustomField" cf WHERE cf.id = "customFieldId"
      AND cf."organizationId" = current_org_id()
  ));

-- GroupMember — via Group
ALTER TABLE "GroupMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GroupMember" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "GroupMember"
  USING (EXISTS (SELECT 1 FROM "Group" g WHERE g.id = "groupId" AND g."organizationId" = current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM "Group" g WHERE g.id = "groupId" AND g."organizationId" = current_org_id()));

-- GroupAttendance — via Group
ALTER TABLE "GroupAttendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GroupAttendance" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "GroupAttendance"
  USING (EXISTS (SELECT 1 FROM "Group" g WHERE g.id = "groupId" AND g."organizationId" = current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM "Group" g WHERE g.id = "groupId" AND g."organizationId" = current_org_id()));

-- AttendanceRecord — via GroupAttendance → Group
ALTER TABLE "AttendanceRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AttendanceRecord" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "AttendanceRecord"
  USING (EXISTS (
    SELECT 1 FROM "GroupAttendance" ga JOIN "Group" g ON g.id = ga."groupId"
    WHERE ga.id = "attendanceId" AND g."organizationId" = current_org_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "GroupAttendance" ga JOIN "Group" g ON g.id = ga."groupId"
    WHERE ga.id = "attendanceId" AND g."organizationId" = current_org_id()
  ));

-- RunSheetItem — via Service
ALTER TABLE "RunSheetItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RunSheetItem" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "RunSheetItem"
  USING (EXISTS (SELECT 1 FROM "Service" s WHERE s.id = "serviceId" AND s."organizationId" = current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM "Service" s WHERE s.id = "serviceId" AND s."organizationId" = current_org_id()));

-- Schedule — via Service
ALTER TABLE "Schedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Schedule" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Schedule"
  USING (EXISTS (SELECT 1 FROM "Service" s WHERE s.id = "serviceId" AND s."organizationId" = current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM "Service" s WHERE s.id = "serviceId" AND s."organizationId" = current_org_id()));

-- Availability — via Person
ALTER TABLE "Availability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Availability" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Availability"
  USING (EXISTS (SELECT 1 FROM "Person" p WHERE p.id = "personId" AND p."organizationId" = current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM "Person" p WHERE p.id = "personId" AND p."organizationId" = current_org_id()));

-- EventRegistration — via Event
ALTER TABLE "EventRegistration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventRegistration" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "EventRegistration"
  USING (EXISTS (SELECT 1 FROM "Event" e WHERE e.id = "eventId" AND e."organizationId" = current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM "Event" e WHERE e.id = "eventId" AND e."organizationId" = current_org_id()));

-- CheckinRecord — via CheckinSession
ALTER TABLE "CheckinRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CheckinRecord" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "CheckinRecord"
  USING (EXISTS (SELECT 1 FROM "CheckinSession" cs WHERE cs.id = "sessionId" AND cs."organizationId" = current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM "CheckinSession" cs WHERE cs.id = "sessionId" AND cs."organizationId" = current_org_id()));

-- Message — via Campaign
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Message"
  USING (EXISTS (SELECT 1 FROM "Campaign" c WHERE c.id = "campaignId" AND c."organizationId" = current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM "Campaign" c WHERE c.id = "campaignId" AND c."organizationId" = current_org_id()));

-- FormField — via Form
ALTER TABLE "FormField" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormField" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "FormField"
  USING (EXISTS (SELECT 1 FROM "Form" f WHERE f.id = "formId" AND f."organizationId" = current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM "Form" f WHERE f.id = "formId" AND f."organizationId" = current_org_id()));

-- FormSubmission — via Form (public form posts also write via superuser path)
ALTER TABLE "FormSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormSubmission" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "FormSubmission"
  USING (EXISTS (SELECT 1 FROM "Form" f WHERE f.id = "formId" AND f."organizationId" = current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM "Form" f WHERE f.id = "formId" AND f."organizationId" = current_org_id()));
