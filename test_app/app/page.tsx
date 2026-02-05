"use client"
import { useState } from "react";
import va from "../../sdk/src/api"

export default function VideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');

  const client = new va("https://videoanalysis-kcot.onrender.com");
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };
  const handleUpload = async () => {
    if (!file) return;

    try {
      setStatus('Uploading...');
      const { jobId } = await client.uploadVideo(file);
      setStatus('Waiting for result...');

      const result = await client.getResult(jobId);
      console.log(result);
      setStatus(`Result: ${JSON.stringify(result)}`);
    } catch (err) {
      console.error(err);
      setStatus('Upload or processing failed');
    }
  };
  return (
    <div className="flex h-svh bg-white justify-center items-center text-black border">
      <div className="flex flex-col h-70 w-150 justify-center items-center text-center border rounded-2xl py-5">
        <h2 className="mb-10">SDK TESTING</h2>
        <div className="flex items-center space-x-4 w-130 overflow-auto mb-3">
          {/* Hidden file input */}
          <input
            id="videoUpload"
            type="file"
            accept="video/*"
            required
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Custom button */}
          <label
            htmlFor="videoUpload"
            className="px-4 py-2 min-w-40 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 transition-colors"
          >
            Upload Video
          </label>

          {/* File name display */}
          <span className="text-gray-700">{file?.name || 'No file selected'}</span>
        </div>
        <button
            onClick={handleUpload}
            className="px-4 py-2 w-130 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            Upload
          </button>
          <p>{status}</p>
        </div>
      </div>
  );
}
