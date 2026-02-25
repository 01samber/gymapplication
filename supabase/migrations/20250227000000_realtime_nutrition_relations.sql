-- Enable realtime for nutritionist/client assignment flow
-- Ensures dietitian_profiles and client_dietitian_assignments work with postgres_changes

-- REPLICA IDENTITY FULL allows realtime to send full row data for filtered subscriptions
ALTER TABLE dietitian_profiles REPLICA IDENTITY FULL;
ALTER TABLE client_dietitian_assignments REPLICA IDENTITY FULL;
