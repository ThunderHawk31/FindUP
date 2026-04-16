import asyncio
import logging
from supabase import Client

logger = logging.getLogger(__name__)


async def check_supabase_connection(supabase_client: Client) -> bool:
    """
    Check Supabase connection with a simple query.
    
    Args:
        supabase_client: Supabase Client instance
        
    Returns:
        True if connection is successful, False otherwise
    """
    try:
        # Execute a simple query with 5 second timeout
        response = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: supabase_client.table("users").select("1").limit(1).execute()
            ),
            timeout=5.0
        )
        logger.info("Supabase connection check successful")
        return True
    except asyncio.TimeoutError:
        logger.warning("Supabase connection check timed out")
        return False
    except Exception as e:
        logger.warning(f"Supabase connection check failed: {type(e).__name__}")
        return False
