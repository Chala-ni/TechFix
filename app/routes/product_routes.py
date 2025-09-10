from app.routes import product_bp
from app.controllers.product_controller import (
    get_products,
    get_product,
    create_product,
    update_product,
    delete_product
)

# Product listing and details
product_bp.route('/', methods=['GET'])(get_products)
product_bp.route('/<int:product_id>', methods=['GET'])(get_product)

# Product management (admin only)
product_bp.route('/', methods=['POST'])(create_product)
product_bp.route('/<int:product_id>', methods=['PUT'])(update_product)
product_bp.route('/<int:product_id>', methods=['DELETE'])(delete_product)
