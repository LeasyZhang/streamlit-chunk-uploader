import os
import json
import base64
import streamlit.components.v1 as components
from datetime import datetime
from .backend import ChunkUploadBackend

_RELEASE = True

if not _RELEASE:
    _component = components.declare_component(
        "chunk_uploader",
        url="http://localhost:3000",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "build")
    _component = components.declare_component(
        "chunk_uploader", 
        path=build_dir
    )

def upload_component(upload_dir="uploads", temp_dir="temp_uploads", chunk_size=5, key=None):

    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs(temp_dir, exist_ok=True)

    session_id = get_session_id()

    backend = ChunkUploadBackend(upload_dir, temp_dir)
    
    backend.clean_temp_files()

    component_params = {
        "chunk_size": chunk_size * 1024 * 1024,
        "session_id": session_id,
    }
    
    result = _component(**component_params, key=key, default=None)
    
    if result and "action" in result:
        action = result["action"]
        
        if action == "save_chunk":
            file_id = result["file_id"]
            chunk_index = result["chunk_index"]
            chunk_data = base64.b64decode(result["chunk_data"])
            print(f"Processing chunk {chunk_index} for file ID {file_id}")
            backend.save_chunk(chunk_data, file_id, chunk_index)
            
            progress = (chunk_index + 1) / result["total_chunks"] * 100
            return {"progress": progress, "file_id": file_id}
        
        elif action == "merge_file":
            file_id = result["file_id"]
            total_chunks = result["total_chunks"]
            file_name = result["file_name"]
            
            final_path, file_size = backend.merge_chunks(file_id, total_chunks, file_name)
            
            file_info = backend.get_file_stats(final_path)
            file_info["name"] = file_name
            file_info["saved_path"] = final_path
            file_info["uploaded_at"] = datetime.now().isoformat()
            
            return file_info
    
    return None

def get_session_id():
    from streamlit.runtime.scriptrunner import get_script_run_ctx
    ctx = get_script_run_ctx()
    return ctx.session_id if ctx else "default_session"