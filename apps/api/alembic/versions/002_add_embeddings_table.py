"""Add embeddings table

Revision ID: 002
Revises: 001
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Create embeddings table
    op.create_table('embeddings',
        sa.Column('chunk_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('file_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('embedding', sa.Text(), nullable=False),
        sa.Column('model', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['chunk_id'], ['chunks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ),
        sa.ForeignKeyConstraint(['file_id'], ['files.id'], ),
        sa.PrimaryKeyConstraint('chunk_id')
    )

    # Create indexes
    op.create_index('idx_embeddings_workspace_file', 'embeddings', ['workspace_id', 'file_id'])
    op.create_index('idx_embeddings_workspace', 'embeddings', ['workspace_id'])

    # Note: Vector index will be created when pgvector is properly set up
    # For now, we'll use a GIN index on the embedding text
    op.create_index('idx_embeddings_vector', 'embeddings', ['embedding'], postgresql_using='gin')


def downgrade() -> None:
    op.drop_index('idx_embeddings_vector')
    op.drop_index('idx_embeddings_workspace')
    op.drop_index('idx_embeddings_workspace_file')
    op.drop_table('embeddings')
    op.execute("DROP EXTENSION IF EXISTS vector")
