import os
import logging
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import jsonify, request, current_app
from app.models.product import Product
from app.models.user import UserRole
from app.models.inventory import Inventory
from app import db
from app.utils.auth import auth_required, admin_required  # Replace login_required

import os.path
from pathlib import Path

# Get absolute path to the uploads folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif','webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def ensure_upload_folder():
    try:
        logging.info(f"Creating upload folder at: {UPLOAD_FOLDER}")
        Path(UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)
        logging.info("Upload folder created/verified successfully")
    except Exception as e:
        logging.error(f"Error creating upload folder: {str(e)}")
        raise

@auth_required
def get_products(current_user):
    # Return all products
    products = Product.query.all()
    return jsonify([product.to_dict() for product in products]), 200

def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict()), 200

@auth_required  # Replace login_required
def create_product(current_user):
    if current_user.role != UserRole.ADMIN:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if 'name' not in request.form or 'part_number' not in request.form:
        return jsonify({'error': 'Missing required fields'}), 400
    
    if Product.query.filter_by(part_number=request.form['part_number']).first():
        return jsonify({'error': 'Part number already exists'}), 400
    
    product = Product(
        name=request.form['name'],
        description=request.form.get('description'),
        manufacturer=request.form.get('manufacturer'),
        part_number=request.form['part_number'],
        category=request.form.get('category')
    )
    
    # Handle image upload
    if 'image' in request.files:
        file = request.files['image']
        logging.info(f"Received file: {file.filename if file else None}")
        if file and file.filename and allowed_file(file.filename):
            try:
                ensure_upload_folder()
                filename = secure_filename(file.filename)
                timestamp = int(datetime.utcnow().timestamp())
                filename = f"{timestamp}_{filename}"
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                logging.info(f"Saving file to: {file_path}")
                file.save(file_path)
                logging.info("File saved successfully")
                product.image = f"uploads/{filename}"
            except Exception as e:
                logging.error(f"Error saving file: {str(e)}")
                raise
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify(product.to_dict()), 201

@auth_required  # Replace login_required
def update_product(current_user, product_id):
    if current_user.role != UserRole.ADMIN:
        return jsonify({'error': 'Unauthorized'}), 403
    
    product = Product.query.get_or_404(product_id)
    
    try:
        # Only validate part_number if it's being changed
        if 'part_number' in request.form and request.form['part_number'] != product.part_number:
            existing_product = Product.query.filter(
                Product.part_number == request.form['part_number'],
                Product.id != product_id
            ).first()
            
            if existing_product:
                return jsonify({'error': 'Part number already exists'}), 400
            product.part_number = request.form['part_number']
        
        # Update other fields if provided
        if 'name' in request.form:
            product.name = request.form['name']
        if 'description' in request.form:
            product.description = request.form['description']
        if 'manufacturer' in request.form:
            product.manufacturer = request.form['manufacturer']
        if 'category' in request.form:
            product.category = request.form['category']
            
            # Handle image upload
            if 'image' in request.files:
                file = request.files['image']
                logging.info(f"Received file for update: {file.filename if file else None}")
                if file and file.filename and allowed_file(file.filename):
                    try:
                        ensure_upload_folder()
                        
                        # Delete old image if it exists
                        if product.image:
                            old_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                                                       'static', product.image)
                            logging.info(f"Attempting to delete old file: {old_file_path}")
                            if os.path.exists(old_file_path):
                                os.remove(old_file_path)
                                logging.info("Old file deleted successfully")
                        
                        filename = secure_filename(file.filename)
                        timestamp = int(datetime.utcnow().timestamp())
                        filename = f"{timestamp}_{filename}"
                        file_path = os.path.join(UPLOAD_FOLDER, filename)
                        logging.info(f"Saving updated file to: {file_path}")
                        file.save(file_path)
                        logging.info("Updated file saved successfully")
                        product.image = f"uploads/{filename}"
                    except Exception as e:
                        logging.error(f"Error in update: {str(e)}")
                        raise
        
        db.session.commit()
        return jsonify({'message': 'Product updated successfully', 'product': product.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_required  # Replace login_required
def delete_product(current_user, product_id):
    if current_user.role != UserRole.ADMIN:
        return jsonify({'error': 'Unauthorized'}), 403
    
    product = Product.query.get_or_404(product_id)
    
    # Check if product is referenced in any quotations or orders
    if product.quotation_items.count() > 0 or product.order_items.count() > 0:
        return jsonify({'error': 'Cannot delete product as it is referenced in quotations or orders'}), 400
    
    # Delete image if exists
    if product.image:
        file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                                'static', product.image)
        if os.path.exists(file_path):
            os.remove(file_path)
    
    db.session.delete(product)
    db.session.commit()
    
    return jsonify({'message': 'Product deleted successfully'}), 200
