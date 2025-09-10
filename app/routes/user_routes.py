from app.routes import user_bp
from app.controllers.user_controller import (
    register_user,
    login,
    logout,
    refresh,
    revoke_refresh_token,
    get_user,
    get_user_by_id,
    update_user,
    update_password,
    delete_user,
    block_user,
    unblock_user,
    get_blocked_users,
    get_users,
    verify_token
)
from app.utils.auth import auth_required
from flask import jsonify

# User registration and authentication
user_bp.route('/register', methods=['POST'])(register_user)
user_bp.route('/login', methods=['POST'])(login)
user_bp.route('/logout', methods=['POST'])(logout)


# User management
user_bp.route('/profile', methods=['GET'])(get_user)
user_bp.route('/profile', methods=['PUT'])(update_user)
user_bp.route('/password', methods=['PUT'])(update_password)
user_bp.route('/user/<int:user_id>', methods=['GET'])(get_user_by_id)
user_bp.route('/user/<int:user_id>', methods=['DELETE'])(delete_user)

# User blocking management
user_bp.route('/<int:user_id>/block', methods=['POST'])(block_user)
user_bp.route('/<int:user_id>/unblock', methods=['POST'])(unblock_user)
user_bp.route('/blocked', methods=['GET'])(get_blocked_users)

# Get users list (with optional role filter)
user_bp.route('/', methods=['GET'])(get_users)

# Update verify endpoint to use the controller function
user_bp.route('/verify', methods=['GET'])(verify_token)

# Token management
user_bp.route('/refresh', methods=['POST'])(refresh)
user_bp.route('/revoke-refresh-token', methods=['POST'])(revoke_refresh_token)
