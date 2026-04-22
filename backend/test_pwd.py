import asyncio
import asyncpg

async def test_pwd(pwd):
    try:
        conn = await asyncpg.connect(user='postgres', password=pwd, database='tradie_migration', host='127.0.0.1', port=5432)
        print(f"Success with password: {pwd}")
        await conn.close()
    except Exception as e:
        if "database" in str(e):
            print(f"Auth success but DB missing with password: {pwd}")
        pass

async def main():
    await test_pwd('123')
    await test_pwd('postgres')
    await test_pwd('password')
    await test_pwd('admin')
    await test_pwd('tradie123')
    
asyncio.run(main())
