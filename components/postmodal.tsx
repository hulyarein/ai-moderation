"use client";

import React, { useState } from "react";
import { Paperclip } from "lucide-react";

type PostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: { file: string; type: "text" | "image" }) => void;
};

const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [text, setText] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handlePost = () => {
    if (activeTab === "text" && text.trim()) {
      onSubmit({ file: text.trim(), type: "text" });
      resetAndClose();
    } else if (activeTab === "image" && selectedFile) {
      const imageUrl = URL.createObjectURL(selectedFile);
      onSubmit({ file: imageUrl, type: "image" });
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setSelectedFile(null);
    setText("");
    setActiveTab("text");
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-96 relative">
        <button
          className="absolute top-2 right-4 text-gray-500 hover:text-gray-700 text-xl"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className="text-xl font-semibold mb-4 text-black">
          Create New Post
        </h2>

        <div className="flex mb-4 border-b border-gray-300">
          <button
            className={`flex-1 py-2 text-center font-semibold ${
              activeTab === "text"
                ? "border-b-2 border-black text-black"
                : "text-gray-500 hover:text-black"
            }`}
            onClick={() => setActiveTab("text")}
          >
            Text
          </button>
          <button
            className={`flex-1 py-2 text-center font-semibold ${
              activeTab === "image"
                ? "border-b-2 border-black text-black"
                : "text-gray-500 hover:text-black"
            }`}
            onClick={() => setActiveTab("image")}
          >
            Image
          </button>
        </div>

        {/* Content */}
        {activeTab === "text" ? (
          <textarea
            className="w-full h-32 p-2 border rounded-lg text-black mb-4"
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <div className="relative mb-2 flex flex-col gap-2 justify-center">
            <label className="flex flex-col gap-2 justify-center items-center h-32 cursor-pointer p-2 rounded-sm bg-gray-200 hover:bg-gray-300">
              <Paperclip className="w-5 h-5 text-gray-700" />
              <p className="text-gray-700 font-bold">Upload photo</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {selectedFile && (
              <div className="mt-3 flex items-center justify-between bg-blue-100 p-2 rounded-md">
                <p className="text-sm text-blue-700 truncate w-4/5">
                  {selectedFile.name}
                </p>
                <button
                  onClick={handleRemoveFile}
                  className="text-gray-400 hover:text-red-500 text-2xl"
                >
                  &times;
                </button>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handlePost}
          className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-black "
          disabled={
            (activeTab === "text" && !text.trim()) ||
            (activeTab === "image" && !selectedFile)
          }
        >
          Post
        </button>
      </div>
    </div>
  );
};

export default PostModal;
