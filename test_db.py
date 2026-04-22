import asyncio
import asyncpg

async def main():
    passwords = ['123', 'tradie123', 'postgres']
    ports = [5432, 5433]
    for pwd in passwords:
        for port in ports:
            try:
                conn = await asyncpg.connect(f'postgresql://postgres:{pwd}@localhost:{port}/tradie_migration')
                print(f'SUCCESS: pwd={pwd} port={port}')
                await conn.close()
                return
            except Exception as e:
                print(f'Fail pwd={pwd} port={port} - {type(e).__name__}')

asyncio.run(main())
