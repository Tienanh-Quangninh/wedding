
-- Wedding categories (nhà trai, nhà gái, việc chung)
CREATE TABLE wedding_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('nha_trai', 'nha_gai', 'chung')),
  color TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wedding_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_categories" ON wedding_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_categories" ON wedding_categories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_categories" ON wedding_categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_categories" ON wedding_categories FOR DELETE TO anon, authenticated USING (true);

-- Wedding tasks / planning items
CREATE TABLE wedding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES wedding_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  deadline DATE,
  estimated_cost BIGINT DEFAULT 0,
  actual_cost BIGINT DEFAULT 0,
  assignee TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wedding_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_tasks" ON wedding_tasks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_tasks" ON wedding_tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_tasks" ON wedding_tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_tasks" ON wedding_tasks FOR DELETE TO anon, authenticated USING (true);

-- Checklist items per task
CREATE TABLE wedding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES wedding_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wedding_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_checklist" ON wedding_checklist FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_checklist" ON wedding_checklist FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_checklist" ON wedding_checklist FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_checklist" ON wedding_checklist FOR DELETE TO anon, authenticated USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON wedding_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
