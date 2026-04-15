import os
import cloudinary
import cloudinary.uploader


def is_production() -> bool:
    return os.getenv("RENDER") is not None


def _configure():
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True,
    )


def upload_media(file_content: bytes, folder: str, resource_type: str = "image") -> str:
    """Upload bytes to Cloudinary and return the secure URL."""
    _configure()
    result = cloudinary.uploader.upload(
        file_content,
        folder=folder,
        resource_type=resource_type,
    )
    return result["secure_url"]
