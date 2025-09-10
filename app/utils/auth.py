from functools import wraps
from flask import jsonify, current_app
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User, UserRole

def get_current_user():
    """
    Utility function to get current authenticated user from JWT token
    """
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    print("JWT identity (user_id):", user_id)  # Debug log
    return User.query.get(int(user_id))  # Convert string ID to integer

def auth_required(fn):
    """
    Decorator that checks if user is authenticated and adds user to request
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            current_user = User.query.get(int(user_id))
            
            if not current_user:
                current_app.logger.error(f'No user found for ID: {user_id}')
                return jsonify({'error': 'User not found'}), 401
                
            return fn(current_user, *args, **kwargs)
            
        except Exception as e:
            current_app.logger.error(f'Authentication error: {str(e)}')
            return jsonify({'error': 'Authentication failed'}), 401
            
    return wrapper

def admin_required(fn):
    """
    Decorator that checks if user is authenticated and is an admin
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            print("Admin check - JWT User ID:", user_id)
            
            current_user = User.query.get(int(user_id))
            print("Admin check - Found User:", current_user.email if current_user else None)
            
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
            if current_user.role != UserRole.ADMIN:
                print(f"User {current_user.email} is not an admin, role: {current_user.role}")
                return jsonify({'error': 'Admin access required'}), 403
            return fn(current_user, *args, **kwargs)
        except Exception as e:
            print("Admin Auth Error:", str(e))
            return jsonify({'error': str(e)}), 401
    return wrapper

def supplier_required(fn):
    """
    Decorator that checks if user is authenticated and is a supplier
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            print("Supplier check - JWT User ID:", user_id)
            
            current_user = User.query.get(int(user_id))
            print("Supplier check - Found User:", current_user.email if current_user else None)
            
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
            if current_user.role != UserRole.SUPPLIER:
                print(f"User {current_user.email} is not a supplier, role: {current_user.role}")
                return jsonify({'error': 'Supplier access required'}), 403
            return fn(current_user, *args, **kwargs)
        except Exception as e:
            print("Supplier Auth Error:", str(e))
            return jsonify({'error': str(e)}), 401
    return wrapper
