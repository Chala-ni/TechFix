from app import db  # Remove login_manager import
from werkzeug.security import generate_password_hash, check_password_hash
import enum
from datetime import datetime

class UserRole(enum.Enum):
    ADMIN = 'admin'
    SUPPLIER = 'supplier'

class UserStatus(enum.Enum):
    ACTIVE = 'active'
    BLOCKED = 'blocked'

class TokenBlacklist(db.Model):
    __tablename__ = 'token_blacklist'
    
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True)
    token_type = db.Column(db.String(10), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    revoked_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)

    @classmethod
    def is_token_revoked(cls, jti):
        return bool(cls.query.filter_by(jti=jti).first())

class User(db.Model): 
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    contact_number = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(200), nullable=True)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.SUPPLIER)
    status = db.Column(db.Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    blocked_at = db.Column(db.DateTime, nullable=True)
    blocked_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Relationships
    created_quotations = db.relationship('Quotation', foreign_keys='Quotation.admin_user_id', backref='admin', lazy='dynamic')
    received_quotations = db.relationship('Quotation', foreign_keys='Quotation.supplier_user_id', backref='supplier', lazy='dynamic')
    revoked_tokens = db.relationship('TokenBlacklist', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    blocked_users = db.relationship('User', 
                                  backref=db.backref('blocked_by_user', remote_side=[id]),
                                  foreign_keys='User.blocked_by')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def block_user(self, admin_user):
        """Block user by admin"""
        if self.role == UserRole.ADMIN:
            raise ValueError("Cannot block admin users")
        self.status = UserStatus.BLOCKED
        self.blocked_at = datetime.utcnow()
        self.blocked_by = admin_user.id
        self.revoke_all_tokens()  # Revoke all tokens when blocked

    def unblock_user(self):
        """Unblock user"""
        self.status = UserStatus.ACTIVE
        self.blocked_at = None
        self.blocked_by = None

    def is_blocked(self):
        """Check if user is blocked"""
        return self.status == UserStatus.BLOCKED

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role.value,
            'status': self.status.value,
            'contact_number': self.contact_number,
            'address': self.address,
            'blocked_at': self.blocked_at.isoformat() if self.blocked_at else None,
            'blocked_by': self.blocked_by
        }

    def revoke_token(self, jti, token_type, expires_at):
        """Add a token to the blacklist"""
        revoked_token = TokenBlacklist(
            jti=jti,
            token_type=token_type,
            user_id=self.id,
            expires_at=expires_at
        )
        db.session.add(revoked_token)
        db.session.commit()

    def revoke_all_tokens(self):
        """Revoke all tokens for this user"""
        self.revoked_tokens.delete()
        db.session.commit()
