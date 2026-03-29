-- Allow all reads for development (not for production!)
CREATE POLICY "Allow all reads" ON events_core FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON events_web FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON compliance_events FOR SELECT USING (true);