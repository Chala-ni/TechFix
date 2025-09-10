from flask import Blueprint

# Create blueprints
user_bp = Blueprint('user', __name__, url_prefix='/api/users')
product_bp = Blueprint('product', __name__, url_prefix='/api/products')
quotation_bp = Blueprint('quotation', __name__, url_prefix='/api/quotations')
order_bp = Blueprint('order', __name__, url_prefix='/api/orders')
inventory_bp = Blueprint('inventory', __name__, url_prefix='/api')

# Import routes
from app.routes.user_routes import *
from app.routes.product_routes import *
from app.routes.quotation_routes import *
from app.routes.order_routes import *
from app.routes.inventory_routes import *
