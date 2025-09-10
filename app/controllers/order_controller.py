from flask import jsonify, request, current_app
from app.models.order import Order, OrderItem, OrderStatus
from app.models.quotation import Quotation, QuotationStatus
from app.models.user import UserRole
from app import db
from app.utils.auth import auth_required, admin_required  # Only use JWT auth decorators
from app.controllers.inventory_controller import InventoryController

@auth_required
def get_orders(current_user):  # current_user is injected by auth_required decorator
    try:
        if current_user.role == UserRole.ADMIN:
            orders = Order.query.all()
        else:  # Supplier
            orders = Order.query.join(Quotation).filter(
                Quotation.supplier_user_id == current_user.id
            ).all()
        
        return jsonify([order.to_dict() for order in orders]), 200
    except Exception as e:
        current_app.logger.error(f'Error getting orders: {str(e)}')
        return jsonify({'error': 'Failed to retrieve orders'}), 500

@auth_required
def get_order(current_user, order_id):
    order = Order.query.get_or_404(order_id)
    
    # Check if user has access to this order
    if (current_user.role != UserRole.ADMIN and 
        order.quotation.supplier_user_id != current_user.id):
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(order.to_dict()), 200

@admin_required
def create_order(current_user):
    data = request.get_json()
    
    if not 'quotation_id' in data:
        return jsonify({'error': 'Quotation ID is required'}), 400
    
    quotation = Quotation.query.get_or_404(data['quotation_id'])
    
    # Check if quotation is accepted
    if quotation.status != QuotationStatus.ACCEPTED:
        return jsonify({'error': 'Can only create order for accepted quotations'}), 400
    
    # Check if order already exists for this quotation
    if Order.query.filter_by(quotation_id=quotation.id).first():
        return jsonify({'error': 'Order already exists for this quotation'}), 400
    
    # Create order
    order = Order(quotation_id=quotation.id)
    db.session.add(order)
    
    # Create order items from quotation items
    for quotation_item in quotation.items:
        order_item = OrderItem(
            order=order,
            product_id=quotation_item.product_id,
            qty=quotation_item.qty,
            price=quotation_item.price
        )
        db.session.add(order_item)
    
    db.session.commit()
    return jsonify(order.to_dict()), 201

@auth_required
def update_order(current_user, order_id):
    order = Order.query.get_or_404(order_id)
    
    # Check if user has access to this order
    if (current_user.role != UserRole.ADMIN and 
        order.quotation.supplier_user_id != current_user.id):
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if 'status' not in data:
        return jsonify({'error': 'Status is required'}), 400
    
    try:
        # Convert status to lowercase for comparison
        status_value = data['status'].lower()
        try:
            new_status = OrderStatus(status_value)
        except ValueError:
            return jsonify({'error': 'Invalid status'}), 400
        
        # Anyone can cancel a pending order
        if status_value == 'cancelled':
            if order.status.value != 'pending':
                return jsonify({'error': 'Can only cancel pending orders'}), 400

        # Other status transitions
        elif current_user.role == UserRole.SUPPLIER:
            # Supplier can only update to confirmed or shipped
            if status_value not in ['confirmed', 'shipped']:
                return jsonify({'error': 'Supplier can only mark order as confirmed or shipped'}), 400
                
            # Can only mark as confirmed if currently pending
            if status_value == 'confirmed' and order.status.value != 'pending':
                return jsonify({'error': 'Can only confirm pending orders'}), 400
                
            # Can only mark as shipped if currently confirmed
            if status_value == 'shipped':
                if order.status.value != 'confirmed':
                    return jsonify({'error': 'Order must be confirmed before shipping'}), 400
                
                # Check and reduce inventory for each order item
                for order_item in order.items:
                    result, error = InventoryController.remove_from_inventory(
                        supplier_id=order.quotation.supplier_user_id,
                        product_id=order_item.product_id,
                        quantity=order_item.qty
                    )
                    if error:
                        db.session.rollback()
                        return jsonify({'error': f'Inventory error: {error}'}), 400
        
        else:  # Admin
            # Admin can update to completed if shipped
            if status_value == 'completed':
                if order.status.value != 'shipped':
                    return jsonify({'error': 'Order must be shipped before completion'}), 400
            # Admin can't change confirmed or shipped status
            elif status_value in ['confirmed', 'shipped']:
                return jsonify({'error': 'Only supplier can mark order as confirmed or shipped'}), 400
        
        order.status = new_status
        db.session.commit()
        
    except ValueError:
        return jsonify({'error': 'Invalid status'}), 400
    
    return jsonify(order.to_dict()), 200

@admin_required
def delete_order(current_user, order_id):
    order = Order.query.get_or_404(order_id)
    
    # Can only delete pending orders
    if order.status.value != 'pending':
        return jsonify({'error': 'Can only delete pending orders'}), 400
    
    db.session.delete(order)
    db.session.commit()
    
    return jsonify({'message': 'Order deleted successfully'}), 200
