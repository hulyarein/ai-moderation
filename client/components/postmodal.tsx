"use client";

import React, { useState, useEffect } from "react";
import { Paperclip, X, Image, Type, Loader2 } from "lucide-react";

// Adding character limit constant
const CHARACTER_LIMIT = 128;

type PostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: {
    file: string;
    type: "text" | "image";
    reviewed: boolean;
  }) => void;
};

const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Create a preview URL for the selected image
  useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    // Free memory when this component is unmounted
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handlePost = async () => {
    setIsSubmitting(true);
    try {
      if (
        activeTab === "text" &&
        text.trim() &&
        text.length <= CHARACTER_LIMIT
      ) {
        onSubmit({ file: text.trim(), type: "text", reviewed: false });
        resetAndClose();
      } else if (activeTab === "image" && selectedFile) {
        const imageUrl = URL.createObjectURL(selectedFile);
        onSubmit({ file: imageUrl, type: "image", reviewed: false });
        resetAndClose();
      }
    } catch (error) {
      console.error("Error posting:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSelectedFile(null);
    setText("");
    setActiveTab("text");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={isSubmitting ? undefined : onClose}
      ></div>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-10 transition-all transform animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold text-gray-800">Create New Post</h2>
          <button
            className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            className={`flex-1 py-3 text-center font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === "text"
                ? "border-b-2 border-red-700 text-red-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("text")}
            disabled={isSubmitting}
          >
            <Type size={18} />
            <span>Text Post</span>
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === "image"
                ? "border-b-2 border-red-700 text-red-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("image")}
            disabled={isSubmitting}
          >
            <Image size={18} />
            <span>Image Post</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === "text" ? (
          <div className="mb-6">
            <textarea
              className={`w-full h-36 p-4 border rounded-xl text-gray-700 resize-none focus:outline-none focus:ring-2 transition-all ${
                text.length > CHARACTER_LIMIT
                  ? "border-red-500 focus:ring-red-500"
                  : text.length > CHARACTER_LIMIT * 0.8
                  ? "border-yellow-400 focus:ring-yellow-400"
                  : "border-gray-300 focus:ring-red-500"
              }`}
              placeholder={`What's on your mind? (${CHARACTER_LIMIT} characters max)`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isSubmitting}
              maxLength={CHARACTER_LIMIT * 1.1} // Allow slightly over for better UX but still prevent submission
            />
            <div
              className={`mt-2 text-right text-sm flex justify-end items-center ${
                text.length > CHARACTER_LIMIT
                  ? "text-red-600 font-medium"
                  : text.length > CHARACTER_LIMIT * 0.8
                  ? "text-yellow-600"
                  : "text-gray-500"
              }`}
            >
              <span>{text.length}</span>
              <span className="mx-1">/</span>
              <span>{CHARACTER_LIMIT}</span>
              {text.length > CHARACTER_LIMIT && (
                <span className="ml-2 text-xs">Character limit exceeded</span>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-6">
            {!selectedFile ? (
              <label className="flex flex-col gap-3 justify-center items-center h-36 cursor-pointer p-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-all">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Paperclip className="w-6 h-6 text-gray-500" />
                </div>
                <div className="text-center">
                  <p className="text-gray-700 font-medium">
                    Drop your image here, or browse
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Supports: JPG, PNG, GIF
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={preview || ""}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <button
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  disabled={isSubmitting}
                  aria-label="Remove image"
                >
                  <X size={16} />
                </button>
                <div className="mt-2 text-xs text-gray-500 pl-2">
                  {selectedFile.name}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handlePost}
          className="w-full bg-red-700 text-white py-3 rounded-xl hover:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed font-medium shadow-sm transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
          disabled={
            isSubmitting ||
            (activeTab === "text" &&
              (!text.trim() || text.length > CHARACTER_LIMIT)) ||
            (activeTab === "image" && !selectedFile)
          }
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader2 size={20} className="animate-spin mr-2" />
              Posting...
            </span>
          ) : (
            "Share Post"
          )}
        </button>
      </div>
    </div>
  );
};

export default PostModal;
