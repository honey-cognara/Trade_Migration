import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

# Load env safely
load_dotenv()

def create_database():
    # Parse DB URL to get credentials but connect to 'postgres' db
    # Fallback to local 5432 with 1234 since that's what docker-compose specifies
    host = "localhost"
    port = "5432"
    user = "postgres"
    password = "123" # Hardcoding local Docker credentials for robust init since .env mismatch often causes issues
    
    # Try different passwords and ports based on earlier attempts
    passwords = ['123', '1234', 'postgres']
    ports = [5432, 5433]
    
    conn = None
    for p in ports:
        for pw in passwords:
            try:
                print(f"Attempting to connect with port {p} and password length {len(pw)}...")
                conn = psycopg2.connect(dbname="postgres", user=user, password=pw, host=host, port=p)
                print(f"✅ Successfully connected to Postgres on port {p}")
                break
            except Exception as e:
                pass
        if conn:
            break
            
    if not conn:
        print("❌ Could not connect to Postgres with any known credentials.")
        return False
        
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    db_name = "tradie_migration"
    
    # Check if DB exists
    cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{db_name}'")
    exists = cur.fetchone()

    if not exists:
        print(f"Creating database {db_name}...")
        cur.execute(f"CREATE DATABASE {db_name}")
        print("✅ Database created successfully")
    else:
        print(f"ℹ️ Database {db_name} already exists")

    # Install pgvector extension if it doesn't exist (done per database)
    conn.close()
    
    # Connect to the target DB to create the vector extension
    for pw in passwords:
        try:
            target_conn = psycopg2.connect(dbname=db_name, user=user, password=pw, host=host, port=p)
            target_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            target_cur = target_conn.cursor()
            target_cur.execute('CREATE EXTENSION IF NOT EXISTS vector;')
            print("✅ pgvector extension enabled.")
            target_conn.close()
            break
        except Exception as e:
            pass

    return True

if __name__ == "__main__":
    create_database()
