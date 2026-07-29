-- Run this script in your PostgreSQL terminal (psql) to set up the database

-- Step 1: Create the database (run this outside of a \c connection, or use pgAdmin)
-- CREATE DATABASE blog_db;

-- Step 2: Connect to the database and create the table
-- \c blog_db

CREATE TABLE IF NOT EXISTS blogs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
