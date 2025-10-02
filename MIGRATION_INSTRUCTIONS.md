# Database Migration Instructions

To enable persistent storage of action notes and time estimates, you need to run the migration SQL.

## Steps:

1. **Apply the migration to your Supabase database:**

   Open your Supabase dashboard → SQL Editor, and run the contents of:
   ```
   supabase/actions-enhancement-migration.sql
   ```

   Or if you're using the Supabase CLI:
   ```bash
   supabase db push
   ```

2. **Verify the migration:**

   After applying, check that the `actions` table has these new columns:
   - `notes` (TEXT)
   - `estimated_time` (INTEGER)
   - `actual_time` (INTEGER)
   - `time_generated` (BOOLEAN)

3. **Test the functionality:**

   - Create a new goal or use an existing one
   - Expand an action to create subactions
   - Refresh the page
   - The subactions should persist and appear under the expanded action

## Debugging:

If subactions don't appear after refresh, check:

1. **Server logs** - Look for console.log messages:
   - "Building action tree from actions: X"
   - "Added subaction ... to parent ..."

2. **Database** - Query the actions table:
   ```sql
   SELECT id, title, parent_id, goal_id FROM actions WHERE goal_id = 'your-goal-id';
   ```

   Subactions should have a `parent_id` that matches their parent action's `id`.

3. **Network tab** - Check the response from `/api/goals`:
   - Actions should have a `subActions` array
   - Nested actions should appear in that array
