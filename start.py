from app import create_app, db
from app.models.user import User, UserRole
from flask_migrate import Migrate
from config import Config
from flask import Flask
import os
from flask import send_from_directory

app = create_app()
migrate = Migrate(app, db)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)



def create_admin_user():
    with app.app_context():
        # Create all database tables
        db.create_all()
        
        # Check if admin user exists
        if not User.query.filter_by(name=Config.ADMIN_NAME).first():
            admin = User(
                name=Config.ADMIN_NAME,
                email=Config.ADMIN_EMAIL,
                role=UserRole.ADMIN
            )
            admin.set_password(Config.ADMIN_PASSWORD)
            db.session.add(admin)
            db.session.commit()
            print('Admin user created successfully')

if __name__ == '__main__':
    create_admin_user()
    app.run(debug=Config.DEBUG)
