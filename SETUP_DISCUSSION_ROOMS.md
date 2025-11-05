# Discussion Rooms Backend Setup Guide

## Quick Setup

### Step 1: Run the SQL Script

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `supabase/setup_discussion_rooms.sql`
5. Click **Run** (or press `Ctrl+Enter`)

### Step 2: Verify Tables Were Created

Go to **Table Editor** in Supabase and verify these tables exist:
- ✅ `discussion_rooms`
- ✅ `room_members`
- ✅ `room_messages`
- ✅ `message_reactions`
- ✅ `room_polls`
- ✅ `poll_votes`

### Step 3: Enable Realtime (Optional but Recommended)

1. Go to **Realtime** in Supabase Dashboard
2. Find the tables: `discussion_rooms`, `room_messages`, `message_reactions`, `room_polls`, `poll_votes`
3. Enable realtime for each table by toggling them on

### Step 4: Test the Setup

1. Refresh your application
2. Go to the Explore page
3. Try creating a room
4. Check browser console for any errors

## Troubleshooting

### Error: "relation does not exist"
- **Solution**: The tables weren't created. Run the SQL script again.

### Error: "permission denied"
- **Solution**: Check that RLS policies were created. Re-run the SQL script.

### Error: "Failed to create room"
- **Solution**: 
  1. Check browser console for detailed error
  2. Verify you're logged in
  3. Check Supabase logs for database errors
  4. Verify the `discussion_rooms` table exists

### Error: "Failed to load discussion rooms"
- **Solution**:
  1. Verify all tables exist in Supabase
  2. Check RLS policies are enabled
  3. Verify you're authenticated
  4. Check browser console for detailed error messages

## Manual Table Creation (If SQL Script Fails)

If the script fails, you can create tables manually:

1. Go to **Table Editor** > **New Table**
2. Create each table with the columns specified in the SQL file
3. Add foreign keys
4. Enable RLS
5. Add policies manually

## SQL Script Location

The complete SQL script is located at:
```
supabase/setup_discussion_rooms.sql
```

## Features Included

✅ Discussion rooms with titles, descriptions, and topics
✅ Room membership tracking
✅ Group messaging
✅ Message reactions (👍, ❤️, 😊)
✅ Polls with voting
✅ Automatic member/message count updates
✅ Real-time updates via Supabase Realtime
✅ Row Level Security (RLS) policies

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs
3. Verify all tables and policies exist
4. Ensure you're authenticated

