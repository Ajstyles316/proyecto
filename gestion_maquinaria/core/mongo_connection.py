from pymongo import MongoClient
from bson import ObjectId
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Global client instance for connection pooling
_client = None
_db = None

def get_client():
    """
    Get MongoDB client with lazy initialization and connection pooling.
    """
    global _client
    
    if _client is None:
        try:
            # Connection options optimized for MongoDB Atlas with longer timeouts for file operations
            connection_options = {
                'serverSelectionTimeoutMS': 5000,  # 5 seconds timeout
                'connectTimeoutMS': 10000,  # 10 seconds connection timeout
                'socketTimeoutMS': 30000,  # 30 seconds socket timeout for large files
                'maxPoolSize': 10,  # Larger connection pool
                'retryWrites': True,  # Enable retries for write operations
                'retryReads': True,  # Enable retries for read operations
                'heartbeatFrequencyMS': 10000,  # Heartbeat every 10 seconds
                'maxIdleTimeMS': 30000,  # Close idle connections after 30 seconds
                'waitQueueTimeoutMS': 5000,  # Wait max 5 seconds for connection from pool
            }
            
            # Check if MONGO_URI is available
            if not settings.MONGO_URI:
                logger.error("MONGO_URI not configured in environment variables")
                raise ValueError("MONGO_URI not configured")
            
            # Try to connect with very short timeout
            _client = MongoClient(settings.MONGO_URI, **connection_options)
            
            # Test the connection with a very short timeout
            _client.admin.command('ping', maxTimeMS=1000)
            logger.info("Successfully connected to MongoDB")
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            _client = None
            # Don't raise the exception, return None instead
            return None
    
    return _client

def get_db():
    """
    Get MongoDB database with lazy initialization.
    """
    global _db
    
    if _db is None:
        client = get_client()
        if client is None:
            logger.warning("MongoDB client is not available")
            return None
        _db = client[settings.MONGO_DB_NAME]
    
    return _db

def get_collection(collection_name_or_class):
    """
    Get MongoDB collection with lazy initialization.
    """
    db = get_db()
    if db is None:
        logger.warning("MongoDB database is not available")
        return None
    
    if hasattr(collection_name_or_class, 'collection_name'):
        return db[collection_name_or_class.collection_name]
    return db[collection_name_or_class]

def get_collection_from_activos_db(collection_name):
    """
    Get collection from 'activos' database.
    """
    client = get_client()
    if client is None:
        logger.warning("MongoDB client is not available")
        return None
    
    activos_db = client["activos"]
    return activos_db[collection_name]

def is_mongodb_available():
    """
    Check if MongoDB is available without raising exceptions.
    """
    try:
        client = get_client()
        if client is None:
            return False
        
        # Quick ping test
        client.admin.command('ping', maxTimeMS=1000)
        return True
    except Exception as e:
        logger.warning(f"MongoDB availability check failed: {str(e)}")
        return False

def close_connection():
    """
    Close MongoDB connection (useful for testing or cleanup).
    """
    global _client, _db
    
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed")