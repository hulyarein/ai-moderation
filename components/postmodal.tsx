"use client";

import React, { useState } from "react";

type PostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: { file: string; type: "text" | "image" }) => void;
};

const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [text, setText] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setText("");
    }
  };

  const handlePost = () => {
    if (text && selectedFile) {
      return;
    }

    if (text.trim()) {
      onSubmit({ file: text.trim(), type: "text" });
      resetAndClose();
    } else if (selectedFile) {
      const imageUrl = URL.createObjectURL(selectedFile);
      onSubmit({ file: imageUrl, type: "image" });
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setSelectedFile(null);
    setText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-110 relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className="text-xl font-semibold mb-4 text-black">
          Create New Post
        </h2>

        <textarea
          className="w-full h-32 p-2 border rounded-lg text-black mb-4"
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!!selectedFile}
        />

        <div className="mb-4">
          <label className="block text-black font-medium mb-2">
            Upload Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            disabled={!!text}
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600">
              Selected file: {selectedFile.name}
            </p>
          )}
        </div>

        <button
          onClick={handlePost}
          className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-black"
        >
          Post
        </button>
      </div>
    </div>
  );
};

export default PostModal;
