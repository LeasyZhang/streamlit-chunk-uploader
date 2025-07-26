import os
import hashlib
import shutil
import time
from datetime import datetime

class ChunkUploadBackend:
    def __init__(self, upload_dir="uploads", temp_dir="temp_chunks"):
        self.upload_dir = upload_dir
        self.temp_dir = temp_dir
        os.makedirs(upload_dir, exist_ok=True)
        os.makedirs(temp_dir, exist_ok=True)
        
    def get_file_id(self, file_name, file_size, session_id):
        """File unique identifier based on name, size, and session ID"""
        unique_str = f"{file_name}-{file_size}-{session_id}"
        return hashlib.md5(unique_str.encode()).hexdigest()
    
    def save_chunk(self, chunk_data, file_id, chunk_index):
        """Persist chunk data to temporary directory"""
        print("Save chunk data to temporary directory ", chunk_index)
        chunk_path = os.path.join(self.temp_dir, f"{file_id}_{chunk_index}.part")
        with open(chunk_path, "wb") as f:
            f.write(chunk_data)
        return chunk_path
    
    def merge_chunks(self, file_id, total_chunks, original_name):
        """merge all chunks into a single file"""
        chunks = []
        for i in range(total_chunks):
            chunk_path = os.path.join(self.temp_dir, f"{file_id}_{i}.part")
            if not os.path.exists(chunk_path):
                raise FileNotFoundError(f"Chunk lost: {chunk_path}")
            chunks.append(chunk_path)
        
        chunks.sort(key=lambda x: int(x.split("_")[-1].split(".")[0]))
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_ext = os.path.splitext(original_name)[1]
        final_name = f"{timestamp}_{original_name}"
        final_path = os.path.join(self.upload_dir, final_name)
        
        with open(final_path, "wb") as outfile:
            for chunk_file in chunks:
                with open(chunk_file, "rb") as infile:
                    outfile.write(infile.read())
                os.remove(chunk_file)
        
        return final_path, os.path.getsize(final_path)
    
    def clean_temp_files(self, max_age=3600):
        now = time.time()
        for filename in os.listdir(self.temp_dir):
            file_path = os.path.join(self.temp_dir, filename)
            file_age = now - os.path.getctime(file_path)
            if file_age > max_age:
                os.remove(file_path)
    
    def get_file_stats(self, file_path):
        if not os.path.exists(file_path):
            return None
            
        stats = os.stat(file_path)
        return {
            "path": file_path,
            "size": stats.st_size,
            "created": datetime.fromtimestamp(stats.st_ctime).isoformat(),
            "modified": datetime.fromtimestamp(stats.st_mtime).isoformat()
        }