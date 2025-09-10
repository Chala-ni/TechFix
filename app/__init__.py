from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
import os

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__, static_folder='../static', static_url_path='')
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.config.from_object(config_class)
    
    # Initialize Flask extensions
    db.init_app(app)
    jwt.init_app(app)  # Keep only JWT initialization
    
    # JWT configuration
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        from app.models.user import TokenBlacklist
        jti = jwt_payload["jti"]
        return TokenBlacklist.is_token_revoked(jti)
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'message': 'The token has expired'}, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'message': 'Invalid token'}, 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {'message': 'Request does not contain valid token'}, 401
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return {'message': 'The token has been revoked'}, 401
    
    # Register blueprints
    from app.routes.user_routes import user_bp
    from app.routes.product_routes import product_bp
    from app.routes.quotation_routes import quotation_bp
    from app.routes.order_routes import order_bp
    from app.routes.inventory_routes import inventory_bp
    app.register_blueprint(user_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(quotation_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(inventory_bp)
    
    # Add route to serve files from uploads directory
    @app.route('/uploads/<filename>')
    def uploaded_file(filename):
        uploads_dir = os.path.join(os.path.dirname(app.root_path), 'uploads')
        return send_from_directory(uploads_dir, filename)
    
    # Serve index.html for root route
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_static(path):
        try:
            # First try to get the file directly
            return app.send_static_file(path)
        except:
            # If file not found and path ends with .html or if it's an API route, return 404
            if path.endswith('.html') or path.startswith('api/'):
                return app.send_static_file('404.html'), 404
            # For any other route, return index.html
            return app.send_static_file('index.html')

    return app
