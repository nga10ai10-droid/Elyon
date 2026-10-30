CREATE UNIQUE INDEX one_pending_order_per_bag ON orders(bag_id) WHERE status='pending';
--> statement-breakpoint
CREATE TRIGGER reserve_inventory AFTER INSERT ON order_lines
BEGIN
 UPDATE inventory SET stock=stock-NEW.quantity WHERE sku=NEW.sku;
END;
--> statement-breakpoint
CREATE TRIGGER release_inventory AFTER UPDATE OF status ON orders
WHEN OLD.status='pending' AND NEW.status='canceled'
BEGIN
 UPDATE inventory SET stock=stock+(SELECT quantity FROM order_lines WHERE order_id=NEW.id AND order_lines.sku=inventory.sku)
 WHERE sku IN (SELECT sku FROM order_lines WHERE order_id=NEW.id);
END;
--> statement-breakpoint
CREATE TRIGGER paid_order AFTER UPDATE OF status ON orders
WHEN OLD.status='pending' AND NEW.status='paid'
BEGIN
 INSERT INTO outbox(id,order_id,kind,status,attempts,created) VALUES(NEW.id,NEW.id,'order_confirmation','pending',0,NEW.created);
 DELETE FROM bag_lines WHERE bag_id=NEW.bag_id AND sku IN (SELECT sku FROM order_lines WHERE order_id=NEW.id) AND quantity <= (SELECT quantity FROM order_lines WHERE order_id=NEW.id AND sku=bag_lines.sku);
 UPDATE bag_lines SET quantity=quantity-(SELECT quantity FROM order_lines WHERE order_id=NEW.id AND sku=bag_lines.sku) WHERE bag_id=NEW.bag_id AND sku IN (SELECT sku FROM order_lines WHERE order_id=NEW.id);
END;
