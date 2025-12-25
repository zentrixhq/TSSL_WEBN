/*
  # Drop Payment Methods Table

  1. Changes
    - Drop the `payment_methods` table and all associated policies and indexes
*/

DROP TABLE IF EXISTS payment_methods CASCADE;