import os
os.environ['DATABASE_URL'] = 'postgresql://neondb_owner:npg_KEgfJlvIM27u@ep-muddy-band-a0te7s70.us-east-1.aws.neon.tech/neondb?sslmode=require'

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text

DATABASE_URL = os.getenv('DATABASE_URL').replace('postgresql://', 'postgresql+asyncpg://')
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def check_assets():
    async with AsyncSessionLocal() as session:
        # Find user by email
        result = await session.execute(
            text("SELECT id, email, \"firstName\", \"lastName\" FROM \"User\" WHERE email = 'jrcb@hotmail.com'")
        )
        user = result.first()
        
        if not user:
            print("User not found!")
            return
            
        print(f"\n=== User: {user.firstName} {user.lastName} ({user.email}) ===\n")
        
        # Get assets
        result = await session.execute(
            text(f"SELECT type, description, \"currentValue\", owner FROM \"Asset\" WHERE \"userId\" = '{user.id}'")
        )
        assets = result.all()
        
        if not assets:
            print("❌ NO ASSETS FOUND!")
            print("\nYou need to add assets in the Profile → Assets section")
        else:
            total = 0
            print("Assets:")
            for asset in assets:
                print(f"  - {asset.type}: {asset.description or 'N/A'} = ${asset.currentValue:,.2f} (Owner: {asset.owner or 'N/A'})")
                total += asset.currentValue or 0
            print(f"\n💰 Total Assets: ${total:,.2f}")
            
            if total <= 0:
                print("\n❌ ERROR: Total assets must be positive to run simulation!")
                print("Please add assets with positive values in Profile → Assets")

asyncio.run(check_assets())
