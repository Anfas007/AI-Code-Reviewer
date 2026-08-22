"""add user_id to reviews

Revision ID: 53245ca698e9
Revises: b0d16f8034ab
Create Date: 2026-08-17 16:32:51.105586

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '53245ca698e9'
down_revision: Union[str, Sequence[str], None] = 'b0d16f8034ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # 1. Add user_id temporarily as nullable
    op.add_column(
        'reviews',
        sa.Column('user_id', sa.Integer(), nullable=True)
    )

    # 2. Assign existing reviews to user ID 1
    op.execute(
        "UPDATE reviews SET user_id = 1 WHERE user_id IS NULL"
    )

    # 3. Make user_id required
    op.alter_column(
        'reviews',
        'user_id',
        existing_type=sa.Integer(),
        nullable=False
    )

    # 4. Add index
    op.create_index(
        op.f('ix_reviews_user_id'),
        'reviews',
        ['user_id'],
        unique=False
    )

    # 5. Add foreign key
    op.create_foreign_key(
        'fk_reviews_user_id_users',
        'reviews',
        'users',
        ['user_id'],
        ['id']
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_constraint(
        'fk_reviews_user_id_users',
        'reviews',
        type_='foreignkey'
    )

    op.drop_index(
        op.f('ix_reviews_user_id'),
        table_name='reviews'
    )

    op.drop_column(
        'reviews',
        'user_id'
    )
