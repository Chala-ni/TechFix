from app.routes import order_bp
from app.controllers.order_controller import (
    get_orders,
    get_order,
    create_order,
    update_order,
    delete_order
)
from app.utils.auth import auth_required, admin_required

# Order listing and details
order_bp.route('/', methods=['GET'])(get_orders) 
order_bp.route('/supplier', methods=['GET'])(get_orders)  # Add supplier-specific route
order_bp.route('/<int:order_id>', methods=['GET'])(get_order)

# Order management
order_bp.route('/', methods=['POST'])(create_order)
order_bp.route('/<int:order_id>', methods=['PUT'])(update_order)  # replaced methods['PUT'] with methods=['PUT']
order_bp.route('/<int:order_id>', methods=['DELETE'])(delete_order)
