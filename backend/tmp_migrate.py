import os
import pymysql
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
        # Check if column exists
        cursor.execute("DESCRIBE persona_sets")
        columns = [row['Field'] for row in cursor.fetchall()]
        
        print(f"Current columns in persona_sets: {columns}")
        
        if 'owner' not in columns:
            print("Adding 'owner' column...")
            cursor.execute("ALTER TABLE persona_sets ADD COLUMN owner VARCHAR(255) NOT NULL DEFAULT 'fiat-lux-system'")
        
        if 'repository' not in columns:
            print("Adding 'repository' column...")
            cursor.execute("ALTER TABLE persona_sets ADD COLUMN repository VARCHAR(255) NOT NULL DEFAULT 'guideline-persona-repo'")
            
        if 'branch' not in columns:
            print("Adding 'branch' column...")
            cursor.execute("ALTER TABLE persona_sets ADD COLUMN branch VARCHAR(255) NOT NULL DEFAULT 'main'")

    connection.commit()
    print("Schema updated successfully!")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'connection' in locals():
        connection.close()
