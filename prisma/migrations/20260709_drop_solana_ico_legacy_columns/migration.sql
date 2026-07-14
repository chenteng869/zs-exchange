-- 清理重复的 snake_case 列
-- 修复：之前 migration 中 ADD COLUMN IF NOT EXISTS 不会删除老的列

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name LIKE 'solana_ico%'
      AND column_name ~ '^[a-z]+_[a-z_]+$'
  LOOP
    EXECUTE format('ALTER TABLE %I DROP COLUMN %I', rec.table_name, rec.column_name);
    RAISE NOTICE 'Dropped % . %', rec.table_name, rec.column_name;
  END LOOP;
END $$;
