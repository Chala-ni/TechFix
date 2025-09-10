from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.controllers.inventory_controller import InventoryController
from app.models.user import UserRole

# Change the blueprint definition to include the URL prefix
inventory_bp = Blueprint('inventory', __name__, url_prefix='/api')

@inventory_bp.route('/inventory/add', methods=['POST'])
@jwt_required()
def add_to_inventory():
    data = request.get_json()
    supplier_id = get_jwt_identity()
    
    if not all(k in data for k in ['product_id', 'quantity']):
        return jsonify({'error': 'Missing required fields'}), 400
        
    if data['quantity'] <= 0:
        return jsonify({'error': 'Quantity must be positive'}), 400
    
    result, error = InventoryController.add_product_to_inventory(
        supplier_id=supplier_id,
        product_id=data['product_id'],
        quantity=data['quantity']
    )
    
    if error:
        return jsonify({'error': error}), 400
        
    return jsonify(result), 200

@inventory_bp.route('/inventory/remove', methods=['POST'])
@jwt_required()
def remove_from_inventory():
    data = request.get_json()
    supplier_id = get_jwt_identity()
    
    if not all(k in data for k in ['product_id', 'quantity']):
        return jsonify({'error': 'Missing required fields'}), 400
        
    if data['quantity'] <= 0:
        return jsonify({'error': 'Quantity must be positive'}), 400
    
    result, error = InventoryController.remove_from_inventory(
        supplier_id=supplier_id,
        product_id=data['product_id'],
        quantity=data['quantity']
    )
    
    if error:
        return jsonify({'error': error}), 400
        
    return jsonify(result), 200

@inventory_bp.route('/inventory/update', methods=['PUT'])
@jwt_required()
def update_inventory():
    data = request.get_json()
    supplier_id = get_jwt_identity()
    
    if not all(k in data for k in ['product_id', 'quantity']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    result, error = InventoryController.update_inventory_quantity(
        supplier_id=supplier_id,
        product_id=data['product_id'],
        new_quantity=data['quantity']
    )
    
    if error:
        return jsonify({'error': error}), 400
        
    return jsonify(result), 200

@inventory_bp.route('/inventory', methods=['GET'])
@jwt_required()
def get_inventory():
    supplier_id = get_jwt_identity()
    
    result, error = InventoryController.get_supplier_inventory(supplier_id)
    
    if error:
        return jsonify({'error': error}), 400
        
    return jsonify(result), 200
