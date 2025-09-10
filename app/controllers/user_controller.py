from flask import jsonify, request, current_app
from werkzeug.security import generate_password_hash
from app.models.user import User, UserRole, UserStatus, TokenBlacklist
from app import db
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    get_jwt,
)
from datetime import datetime, timezone
from app.utils.auth import auth_required, admin_required, get_current_user
import logging

def register_user():
    data = request.get_json()
    
    if not all(k in data for k in ['name', 'email', 'password']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Set default role as supplier, only allow admin role if specifically requested by an admin
    role = UserRole.SUPPLIER
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(
        name=data['name'],
        email=data['email'],
        role=role,
        status=UserStatus.ACTIVE,
        contact_number=data.get('contact_number'),
        address=data.get('address')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify(user.to_dict()), 201

def login():
    try:
        data = request.get_json()
        
        if not all(k in data for k in ['password']) or not any(k in data for k in ['name', 'email']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Try to find user by name or email
        if 'name' in data:
            user = User.query.filter_by(name=data['name']).first()
        else:
            user = User.query.filter_by(email=data['email']).first()
        
        if user is None or not user.check_password(data['password']):
            current_app.logger.warning(f'Failed login attempt for user: {data.get("name") or data.get("email")}')
            return jsonify({'error': 'Invalid name or password'}), 401

        # Check if user is blocked
        if user.is_blocked():
            current_app.logger.warning(f'Blocked user attempted login: {user.email}')
            return jsonify({
                'error': 'Account is blocked',
                'blocked_at': user.blocked_at.isoformat() if user.blocked_at else None
            }), 403
        
        # Create tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        current_app.logger.info(f'Successful login for user: {user.email} (role: {user.role})')
        
        return jsonify({
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Login error: {str(e)}')
        return jsonify({'error': 'An error occurred during login'}), 500

@auth_required
def logout(current_user):
    jti = get_jwt()["jti"]
    now = datetime.now(timezone.utc)
    
    # Add token to blocklist
    current_user.revoke_token(
        jti=jti,
        token_type="access",
        expires_at=now
    )
    
    return jsonify({'message': 'Successfully logged out'}), 200

@auth_required
def refresh(current_user):
    """
    Endpoint for refreshing access token using refresh token
    """
    # Check if user is blocked
    if current_user.is_blocked():
        return jsonify({
            'error': 'Account is blocked',
            'blocked_at': current_user.blocked_at.isoformat() if current_user.blocked_at else None
        }), 403

    # Create new access token
    access_token = create_access_token(identity=current_user.id)
    
    return jsonify({
        'access_token': access_token
    }), 200

@auth_required
def revoke_refresh_token(current_user):
    """
    Endpoint for revoking the current user's refresh token
    """
    jti = get_jwt()["jti"]
    now = datetime.now(timezone.utc)
    
    current_user.revoke_token(
        jti=jti,
        token_type="refresh",
        expires_at=now
    )
    
    return jsonify({'message': 'Refresh token revoked'}), 200

@auth_required
def get_user(current_user):
    """Get current user's profile"""
    return jsonify(current_user.to_dict()), 200

@auth_required
def get_user_by_id(current_user, user_id):
    """Get user by ID (admin only)"""
    # Admin can view any user
    if current_user.role != UserRole.ADMIN:
        return jsonify({'error': 'Unauthorized'}), 403
        
    target_user = User.query.get_or_404(user_id)
    return jsonify(target_user.to_dict()), 200

@auth_required
def update_user(current_user):
    """Update user profile information"""
    data = request.get_json()
    
    if 'name' in data and data['name'] != current_user.name:
        current_user.name = data['name']
        
    if 'email' in data and data['email'] != current_user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        current_user.email = data['email']
    
    if 'phone' in data:
        current_user.contact_number = data['phone']
        
    if 'address' in data:
        current_user.address = data['address']
        
    if 'company' in data:
        current_user.company_name = data['company']
    
    db.session.commit()
    return jsonify(current_user.to_dict()), 200

@auth_required
def update_password(current_user):
    """Update user password"""
    data = request.get_json()
    
    if not all(k in data for k in ['current_password', 'new_password']):
        return jsonify({'error': 'Missing required fields'}), 400
        
    # Verify current password
    if not current_user.check_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401
        
    # Update password
    current_user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password updated successfully'}), 200

@admin_required
def delete_user(current_user, user_id):
    target_user = User.query.get_or_404(user_id)
    
    # Prevent admin from deleting themselves
    if current_user.id == user_id:
        return jsonify({'error': 'Cannot delete your own admin account'}), 400
    
    # Revoke all tokens for the user being deleted
    target_user.revoke_all_tokens()
    
    db.session.delete(target_user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200

@admin_required
def block_user(current_user, user_id):
    """Block a supplier user"""
    target_user = User.query.get_or_404(user_id)
    
    try:
        target_user.block_user(current_user)
        db.session.commit()
        return jsonify({'message': 'User blocked successfully', 'user': target_user.to_dict()}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@admin_required
def unblock_user(current_user, user_id):
    """Unblock a supplier user"""
    target_user = User.query.get_or_404(user_id)
    
    if not target_user.is_blocked():
        return jsonify({'error': 'User is not blocked'}), 400
    
    target_user.unblock_user()
    db.session.commit()
    return jsonify({'message': 'User unblocked successfully', 'user': target_user.to_dict()}), 200

@auth_required
def get_blocked_users(current_user):
    """Get list of blocked users (admin only)"""
    if current_user.role != UserRole.ADMIN:
        return jsonify({'error': 'Unauthorized'}), 403
        
    blocked_users = User.query.filter_by(status=UserStatus.BLOCKED).all()
    return jsonify({
        'blocked_users': [user.to_dict() for user in blocked_users]
    }), 200

@auth_required
def get_users(current_user):
    """Get list of users with optional role filter"""
    if current_user.role != UserRole.ADMIN:
        return jsonify({'error': 'Unauthorized'}), 403

    role = request.args.get('role')
    query = User.query

    if role:
        try:
            # Handle case-insensitive role matching
            role_mappings = {
                'supplier': UserRole.SUPPLIER,
                'admin': UserRole.ADMIN
            }
            role_lower = role.lower()
            if role_lower not in role_mappings:
                return jsonify({'error': f'Invalid role. Must be one of: {list(role_mappings.keys())}'}), 400
                
            role_enum = role_mappings[role_lower]
            query = query.filter_by(role=role_enum)
        except Exception as e:
            print("Role filtering error:", str(e))
            return jsonify({'error': 'Error processing role filter'}), 400

    users = query.all()
    return jsonify([user.to_dict() for user in users]), 200

def verify_token():
    try:
        # Get current user from JWT token
        current_user = get_current_user()
        if not current_user:
            current_app.logger.error('No user found for token')
            return jsonify({'error': 'Invalid token'}), 401

        current_app.logger.info(f'Token verified for user: {current_user.email} (role: {current_user.role})')
        return jsonify({
            'valid': True,
            'user': current_user.to_dict()
        }), 200
    except Exception as e:
        current_app.logger.error(f'Token verification failed: {str(e)}')
        return jsonify({'error': str(e)}), 401
