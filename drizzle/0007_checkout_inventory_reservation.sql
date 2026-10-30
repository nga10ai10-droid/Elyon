-- Checkout now deducts inventory explicitly in the order creation batch.
-- Keep release_inventory and paid_order unchanged.
DROP TRIGGER IF EXISTS reserve_inventory;
