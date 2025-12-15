
# backend/create_tables.py
import os
import sys

# Add the parent directory (backend/) to the path to find 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__))) 

from app.db import engine
from app.models import Base

# Drop all tables first to handle schema changes (Development only!)
Base.metadata.drop_all(bind=engine)

# This line sends the schema defined in models.py to Neon
Base.metadata.create_all(bind=engine)

print("ProductOutcome table recreated successfully in Neon with new schema (Confidence & Red Ocean).")
