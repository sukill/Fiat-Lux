import os
import pymysql
import json
from urllib.parse import urlparse
from dotenv import load_dotenv
from pathlib import Path

# Load env
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

DB_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/fiat_lux")
print(f"Connecting to {DB_URL}")

# Parse URL
result = urlparse(DB_URL)
user = result.username
password = result.password
host = result.hostname
port = result.port or 3306
database = result.path.lstrip('/')

try:
    connection = pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=database,
        port=port,
        cursorclass=pymysql.cursors.DictCursor
    )

    with connection.cursor() as cursor:
        # Check if column exists in persona_sets
        cursor.execute("DESCRIBE persona_sets")
        columns = [row['Field'] for row in cursor.fetchall()]
        
        if 'persona_ids' not in columns:
            print("Adding 'persona_ids' column to persona_sets...")
            cursor.execute("ALTER TABLE persona_sets ADD COLUMN persona_ids JSON NOT NULL")
            # Initialize with empty list for existing rows
            cursor.execute("UPDATE persona_sets SET persona_ids = '[]'")
        
        print("Dropping redundant tables...")
        cursor.execute("DROP TABLE IF EXISTS persona_set_association")
        cursor.execute("DROP TABLE IF EXISTS agent_personas")

    connection.commit()
    print("Schema cleanup completed successfully!")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'connection' in locals():
        connection.close()
