from app.utils.auth import auth_required, admin_required
from flask import jsonify, request
from app.models.quotation import Quotation, QuotationItem, QuotationStatus
from app.models.user import UserRole
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.models.inventory import Inventory
from app import db

@auth_required
def get_quotations(current_user):
    if current_user.role == UserRole.ADMIN:
        quotations = Quotation.query.all()
    else:  # Supplier
        quotations = Quotation.query.filter_by(supplier_user_id=current_user.id).all()
    
    return jsonify([quotation.to_dict() for quotation in quotations]), 200

@auth_required
def get_quotation(current_user, quotation_id):
    quotation = Quotation.query.get_or_404(quotation_id)
    
    if (current_user.role != UserRole.ADMIN and 
        current_user.id != quotation.supplier_user_id):
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(quotation.to_dict()), 200

@auth_required
def create_quotation(current_user):
    data = request.get_json()
    
    if 'items' not in data or not data['items']:
        return jsonify({'error': 'Quotation items are required'}), 400
        
    if current_user.role == UserRole.SUPPLIER:
        # For suppliers, create self-quotation
        quotation = Quotation(
            admin_user_id=1,  # Default admin ID
            supplier_user_id=current_user.id
        )
    else:
        # For admins, require supplier_user_id
        if 'supplier_user_id' not in data:
            return jsonify({'error': 'supplier_user_id is required'}), 400
            
        quotation = Quotation(
            admin_user_id=current_user.id,
            supplier_user_id=data['supplier_user_id']
        )
    
    db.session.add(quotation)
    
    # Add quotation items
    for item_data in data['items']:
        if not all(k in item_data for k in ['product_id', 'qty', 'price']):
            db.session.rollback()
            return jsonify({'error': 'Missing required fields in items'}), 400
        
        # Verify product exists
        product = Product.query.get(item_data['product_id'])
        if not product:
            db.session.rollback()
            return jsonify({'error': f'Product {item_data["product_id"]} not found'}), 404
        
        # Check if product exists in supplier's inventory with sufficient quantity
        inventory_item = Inventory.query.filter_by(
            supplier_id=quotation.supplier_user_id,
            product_id=item_data['product_id']
        ).first()
        
        if not inventory_item:
            db.session.rollback()
            return jsonify({'error': f'Product {item_data["product_id"]} not found in supplier inventory'}), 400
            
        if inventory_item.quantity < item_data['qty']:
            db.session.rollback()
            return jsonify({'error': f'Insufficient quantity for product {item_data["product_id"]} in inventory'}), 400
        
        item = QuotationItem(
            quotation=quotation,
            product_id=item_data['product_id'],
            qty=item_data['qty'],
            price=item_data['price']
        )
        db.session.add(item)
    
    db.session.commit()
    return jsonify(quotation.to_dict()), 201

@auth_required
def update_quotation(current_user, quotation_id):
    quotation = Quotation.query.get_or_404(quotation_id)
    
    # Only admin can update details, supplier can only update status
    if current_user.role != UserRole.ADMIN and current_user.id != quotation.supplier_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if current_user.role == UserRole.SUPPLIER:
        # Supplier can only update status to ACCEPTED or DECLINED
        if 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
            
        try:
            new_status = QuotationStatus(data['status'])
            if new_status not in [QuotationStatus.ACCEPTED, QuotationStatus.DECLINED]:
                return jsonify({'error': 'Invalid status'}), 400
                
            quotation.status = new_status
            
        except ValueError:
            return jsonify({'error': 'Invalid status'}), 400
            
    else:  # Admin
        if 'items' in data:
            # Remove existing items
            QuotationItem.query.filter_by(quotation_id=quotation.id).delete()
            
            # Add new items
            for item_data in data['items']:
                if not all(k in item_data for k in ['product_id', 'qty', 'price']):
                    db.session.rollback()
                    return jsonify({'error': 'Missing required fields in items'}), 400
                
                # Verify product exists
                product = Product.query.get(item_data['product_id'])
                if not product:
                    db.session.rollback()
                    return jsonify({'error': f'Product {item_data["product_id"]} not found'}), 404
                
                # Check if product exists in supplier's inventory with sufficient quantity
                inventory_item = Inventory.query.filter_by(
                    supplier_id=quotation.supplier_user_id,
                    product_id=item_data['product_id']
                ).first()
                
                if not inventory_item:
                    db.session.rollback()
                    return jsonify({'error': f'Product {item_data["product_id"]} not found in supplier inventory'}), 400
                    
                if inventory_item.quantity < item_data['qty']:
                    db.session.rollback()
                    return jsonify({'error': f'Insufficient quantity for product {item_data["product_id"]} in inventory'}), 400
                
                item = QuotationItem(
                    quotation=quotation,
                    product_id=item_data['product_id'],
                    qty=item_data['qty'],
                    price=item_data['price']
                )
                db.session.add(item)
    
    db.session.commit()
    return jsonify(quotation.to_dict()), 200

@admin_required
def delete_quotation(current_user, quotation_id):
    quotation = Quotation.query.get_or_404(quotation_id)
    
    # Check if quotation has associated orders
    if quotation.order:
        return jsonify({'error': 'Cannot delete quotation with associated orders'}), 400
    
    db.session.delete(quotation)
    db.session.commit()
    
    return jsonify({'message': 'Quotation deleted successfully'}), 200

@admin_required
def approve_quotation(current_user, quotation_id):
    quotation = Quotation.query.get_or_404(quotation_id)
    
    if quotation.status != QuotationStatus.PENDING:
        return jsonify({'error': 'Can only approve pending quotations'}), 400
    
    try:
        # Create new order
        order = Order(
            quotation_id=quotation.id,
            status=OrderStatus.PENDING
        )
        db.session.add(order)
        
        # Create order items from quotation items
        for q_item in quotation.items:
            order_item = OrderItem(
                order=order,
                product_id=q_item.product_id,
                qty=q_item.qty,
                price=q_item.price
            )
            db.session.add(order_item)
        
        # Update quotation status
        quotation.status = QuotationStatus.ACCEPTED
        
        db.session.commit()
        return jsonify({
            'message': 'Quotation approved and order created successfully',
            'order': order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to approve quotation: {str(e)}'}), 500

@admin_required
def reject_quotation(current_user, quotation_id):
    quotation = Quotation.query.get_or_404(quotation_id)
    
    if quotation.status != QuotationStatus.PENDING:
        return jsonify({'error': 'Can only reject pending quotations'}), 400
        
    try:
        quotation.status = QuotationStatus.DECLINED
        db.session.commit()
        return jsonify({'message': 'Quotation rejected successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to reject quotation: {str(e)}'}), 500
