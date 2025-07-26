import { Streamlit, RenderData } from "streamlit-component-lib"

// Notify Streamlit that the component is ready
Streamlit.setComponentReady();
Streamlit.setFrameHeight();

// DOM Elements
const fileInput = document.getElementById("file-input") as HTMLInputElement;
const selectButton = document.getElementById("select-button") as HTMLButtonElement;
const startButton = document.getElementById("start-upload") as HTMLButtonElement;
const mergeButton = document.getElementById("merge-file") as HTMLButtonElement;
const resetButton = document.getElementById("reset-btn") as HTMLButtonElement;
const fileNameDisplay = document.getElementById("file-name") as HTMLElement;
const fileSizeDisplay = document.getElementById("file-size") as HTMLElement;
const chunkInfoDisplay = document.getElementById("chunk-info") as HTMLElement;
const progressBar = document.getElementById("progress-bar") as HTMLElement;
const progressText = document.getElementById("progress-text") as HTMLElement;
const chunkSizeDisplay = document.getElementById("chunk-size-display") as HTMLElement;
const chunkCountDisplay = document.getElementById("chunk-count") as HTMLElement;
const chunksUploadedDisplay = document.getElementById("chunks-uploaded") as HTMLElement;
const uploadStatusDisplay = document.getElementById("upload-status") as HTMLElement;
const statusSection = document.getElementById("status-section") as HTMLElement;

// Global Variables
let selectedFile: File | null = null;
let chunkSize = 5 * 1024 * 1024; // Default 5MB
let totalChunks = 0;
let currentChunk = 0;
let fileId: string | null = null;

// Handle Render Event from Streamlit
function onRender(event: Event): void {
  const data = (event as CustomEvent<RenderData>).detail;

  // Update chunk size if provided by Streamlit
  if (data.args.chunk_size) {
    chunkSize = data.args.chunk_size;
    chunkSizeDisplay.textContent = `${Math.round(chunkSize / (1024 * 1024))} MB`;
  }

  // Reset component height
  Streamlit.setFrameHeight();
}

// Attach Render Event Listener
Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender);

// File Selection Handler
function handleFileSelect(e: Event): void {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length) {
    selectedFile = target.files[0];
    updateFileInfo();
  }
}

// Update File Info
function updateFileInfo(): void {
  if (!selectedFile) return;

  fileNameDisplay.textContent = selectedFile.name;
  fileSizeDisplay.textContent = `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`;

  totalChunks = Math.ceil(selectedFile.size / chunkSize);
  chunkCountDisplay.textContent = totalChunks.toString();
  chunkInfoDisplay.textContent = `0/${totalChunks}`;
  chunksUploadedDisplay.textContent = "0";

  fileId = generateFileId(selectedFile.name, selectedFile.size);
  startButton.disabled = false;
}

// Generate File ID
function generateFileId(fileName: string, fileSize: number): string {
  return `${fileName}-${fileSize}`.replace(/[^a-zA-Z0-9_\-]/g, "_");
}

// Start Upload
function startUpload(): void {
  if (!selectedFile) {
    addStatusMessage("Select File", "error");
    return;
  }

  if (currentChunk >= totalChunks) {
    addStatusMessage("File Upload Complete", "info");
    return;
  }

  startButton.disabled = true;
  mergeButton.disabled = true;
  selectButton.disabled = true;
  uploadStatusDisplay.textContent = "Uploading...";
  addStatusMessage("Start uploading selected file...", "info");

  Streamlit.setComponentValue({
    action: "start_upload",
    file_id: fileId,
    file_name: selectedFile.name,
    total_chunks: totalChunks,
  });

  processNextChunk();
}


async function processNextChunk(): Promise<void> {
  console.log(`Processing chunk ${currentChunk} of ${totalChunks}`);
  if (!selectedFile || currentChunk >= totalChunks) return;

  for (currentChunk = 0; currentChunk < totalChunks; currentChunk++) {
    const start = currentChunk * chunkSize;
    const end = Math.min(start + chunkSize, selectedFile.size);
    const chunkData = selectedFile.slice(start, end);

    const base64Data = await readAsBase64(chunkData);

    await Streamlit.setComponentValue({
      action: "save_chunk",
      file_id: fileId,
      chunk_index: currentChunk,
      total_chunks: totalChunks,
      chunk_data: base64Data,
      file_name: selectedFile.name,
    });
    chunkInfoDisplay.textContent = `${currentChunk+1}/${totalChunks}`;
    chunksUploadedDisplay.textContent = (currentChunk+1).toString();

    const progress = Math.round(((currentChunk+1) / totalChunks) * 100);
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;
  }

  mergeButton.disabled = false;
  uploadStatusDisplay.textContent = "Upload complete";

}

function mergeFile(): void {
  if (!selectedFile || currentChunk < totalChunks) {
    addStatusMessage("Please upload all chunks", "error");
    return;
  }
  uploadStatusDisplay.textContent = "Merge chunks...";
  addStatusMessage("All chunks are uploaded, merging...", "info");
  Streamlit.setComponentValue({
    action: "merge_file",
    file_id: fileId,
    total_chunks: totalChunks,
    file_name: selectedFile.name,
  });
  uploadStatusDisplay.textContent = "File merged successfully!";
}

// Read File as Base64
function readAsBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = (error) => reject(error);
  });
}

// Reset Upload
function resetUpload(): void {
  selectedFile = null;
  currentChunk = 0;
  totalChunks = 0;
  fileId = null;

  fileNameDisplay.textContent = "No file selected";
  fileSizeDisplay.textContent = "0 MB";
  chunkInfoDisplay.textContent = "0/0";
  chunkCountDisplay.textContent = "0";
  chunksUploadedDisplay.textContent = "0";
  progressBar.style.width = "0%";
  progressText.textContent = "0%";
  uploadStatusDisplay.textContent = "Waiting for file upload...";

  fileInput.value = "";
  startButton.disabled = false;
  mergeButton.disabled = true;
  selectButton.disabled = false;

  statusSection.innerHTML =
    '<h3>Upload Status</h3><div class="status-message info" id="status-default"><p>Please select file to upload</p></div>';

  Streamlit.setComponentValue({
    action: "reset_upload",
  });
}

// Add Status Message
function addStatusMessage(message: string, type: "info" | "error" | "success" = "info"): void {
  const defaultElement = document.getElementById("status-default");
  if (defaultElement) defaultElement.remove();

  const statusElement = document.createElement("div");
  statusElement.className = `status-message ${type}`;
  statusElement.innerHTML = `<p>${new Date().toLocaleTimeString()}: ${message}</p>`;

  statusSection.appendChild(statusElement);
}

// Event Listeners
selectButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", handleFileSelect);
startButton.addEventListener("click", startUpload);
resetButton.addEventListener("click", resetUpload);
mergeButton.addEventListener("click", mergeFile);
