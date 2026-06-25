import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'sb_publishable_lm9f2rL0iOZ_kpYT74-Kaw_VKZvsV77'; 
const supabaseAnonKey = 'TeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd2xheHRwZHlhY2xoYXNpc2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNzY2NzQsImV4cCI6MjA5Nzk1MjY3NH0._wQqiZEvT9K58FYn1Tfa4bL1-Zl0sPoeLujua_mvJk0'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);