from app import db
from app.models.inventory import Inventory
from app.models.user import UserRole
from flask_jwt_extended import get_jwt_identity
from sqlalchemy.exc import IntegrityError

class InventoryController:
    @staticmethod
    def add_product_to_inventory(supplier_id, product_id, quantity):
        """Add or update product quantity in supplier's inventory"""
        try:
            inventory_item = Inventory.query.filter_by(
                supplier_id=supplier_id,
                product_id=product_id
            ).first()
            
            if inventory_item:
                # Update existing inventory
                inventory_item.quantity += quantity
            else:
                # Create new inventory entry
                inventory_item = Inventory(
                    supplier_id=supplier_id,
                    product_id=product_id,
                    quantity=quantity
                )
                db.session.add(inventory_item)
                
            db.session.commit()
            return inventory_item.to_dict(), None
        except IntegrityError as e:
            db.session.rollback()
            return None, "Database error occurred"
        except Exception as e:
            db.session.rollback()
            return None, str(e)

    @staticmethod
    def remove_from_inventory(supplier_id, product_id, quantity):
        """Remove quantity of a product from supplier's inventory"""
        try:
            inventory_item = Inventory.query.filter_by(
                supplier_id=supplier_id,
                product_id=product_id
            ).first()
            
            if not inventory_item:
                return None, "Product not found in inventory"
                
            if inventory_item.quantity < quantity:
                return None, "Insufficient quantity in inventory"
                
            inventory_item.quantity -= quantity
            db.session.commit()
            
            return inventory_item.to_dict(), None
        except Exception as e:
            db.session.rollback()
            return None, str(e)

    @staticmethod
    def update_inventory_quantity(supplier_id, product_id, new_quantity):
        """Update the quantity of a product in supplier's inventory"""
        try:
            if new_quantity < 0:
                return None, "Quantity cannot be negative"
                
            inventory_item = Inventory.query.filter_by(
                supplier_id=supplier_id,
                product_id=product_id
            ).first()
            
            if not inventory_item:
                # Create new inventory entry
                inventory_item = Inventory(
                    supplier_id=supplier_id,
                    product_id=product_id,
                    quantity=new_quantity
                )
                db.session.add(inventory_item)
            else:
                # Update existing inventory
                inventory_item.quantity = new_quantity
                
            db.session.commit()
            return inventory_item.to_dict(), None
        except Exception as e:
            db.session.rollback()
            return None, str(e)

    @staticmethod
    def get_supplier_inventory(supplier_id):
        """Get all inventory items for a supplier"""
        try:
            inventory_items = Inventory.query.filter_by(supplier_id=supplier_id).all()
            return [item.to_dict() for item in inventory_items], None
        except Exception as e:
            return None, str(e)
