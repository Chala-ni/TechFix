from app.routes import quotation_bp
from app.controllers.quotation_controller import (
    get_quotations,
    get_quotation,
    create_quotation,
    update_quotation,
    delete_quotation,
    approve_quotation,
    reject_quotation
)

# Quotation listing and details
quotation_bp.route('/', methods=['GET'])(get_quotations)
quotation_bp.route('/<int:quotation_id>', methods=['GET'])(get_quotation)

# Quotation management
quotation_bp.route('/', methods=['POST'])(create_quotation)  # Admin only
quotation_bp.route('/<int:quotation_id>', methods=['PUT'])(update_quotation)  # Admin can update details, supplier can update status
quotation_bp.route('/<int:quotation_id>', methods=['DELETE'])(delete_quotation)  # Admin only

# Quotation approval/rejection
quotation_bp.route('/<int:quotation_id>/approve', methods=['POST'])(approve_quotation)  # Admin only
quotation_bp.route('/<int:quotation_id>/reject', methods=['POST'])(reject_quotation)  # Admin only
