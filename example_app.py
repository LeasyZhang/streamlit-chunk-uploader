import time
import streamlit as st
from chunk_upload.component import upload_component

st.set_page_config(
    page_title="Chunk Upload Demo",
    page_icon="⬆️",
    layout="wide"
)

st.title("Streamlit Chunk Upload React-less Demo")


st.subheader("Upload File")
result = upload_component(
    upload_dir="uploads",
    temp_dir="temp_uploads",
    chunk_size=5
)
    
if result:
    st.success("✅ Upload Finished！")
    st.json(result)