-- Run this in the Supabase SQL editor to set up the schema.
-- Dashboard → SQL Editor → New query → paste and run.

create extension if not exists "pgcrypto";

create table if not exists groups (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  password_hash text not null,
  rating_mode   text not null default 'public'
    check (rating_mode in ('public', 'private')),
  is_public     boolean not null default false,
  created_at    timestamptz default now()
);

-- Migration for existing installs (safe to run multiple times):
-- alter table groups add column if not exists is_public boolean not null default false;

create table if not exists books (
  id              uuid primary key default gen_random_uuid(),
  google_books_id text unique not null,
  title           text not null,
  author          text,
  cover_url       text,
  description     text,
  genre           text,
  published_year  int,
  page_count      int
);

create table if not exists group_books (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references groups(id) on delete cascade,
  book_id     uuid not null references books(id),
  status      text not null default 'want_to_read'
    check (status in ('want_to_read', 'already_read')),
  added_at    timestamptz default now(),
  finished_at timestamptz,
  unique(group_id, book_id)
);

create table if not exists ratings (
  id            uuid primary key default gen_random_uuid(),
  group_book_id uuid not null references group_books(id) on delete cascade,
  rater_id      text not null,
  stars         int not null check (stars between 1 and 10),
  created_at    timestamptz default now(),
  unique(group_book_id, rater_id)
);

-- Indexes for common query patterns
create index if not exists idx_group_books_group_status on group_books(group_id, status);
create index if not exists idx_ratings_group_book on ratings(group_book_id);
