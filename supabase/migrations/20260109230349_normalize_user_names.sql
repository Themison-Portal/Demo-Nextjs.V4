-- Normalize user names to first_name and last_name  
 -- Date: 2026-01-09

-- Add new columns  
 ALTER TABLE users  
 ADD COLUMN first_name TEXT,  
 ADD COLUMN last_name TEXT;

-- Migrate existing full_name data (if any)  
 -- Split by first space: "John Doe" → first_name: "John", last_name: "Doe"  
 UPDATE users  
 SET  
 first_name = SPLIT_PART(full_name, ' ', 1),  
 last_name = CASE  
 WHEN full_name LIKE '% %' THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)  
 ELSE NULL  
 END  
 WHERE full_name IS NOT NULL;

-- Drop old column  
 ALTER TABLE users  
 DROP COLUMN full_name;  