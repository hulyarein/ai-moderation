"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, AlertCircle, User, Shield } from "lucide-react";
import { generateRandomUsername } from "@/utils/usernameGenerator";

type PostCardProps = {
  file: string;
  type: "image" | "text";
  reviewed: boolean;
  approved?: boolean; // Added approved field
  isOwner?: boolean;
  username?: string | null;
  isNew?: boolean;
};

const PostCard: React.FC<PostCardProps> = ({
  file,
  type,
  reviewed,
  approved = true, // Default to approved
  isOwner = false,
  username: providedUsername,
  isNew = false,
}) => {
  const [username, setUsername] = useState<string | null>(null);

  // If a username is provided, use it; otherwise, generate a random one
  useEffect(() => {
    if (providedUsername) {
      setUsername(providedUsername);
    } else {
      // Generate a random username for posts from other users
      setUsername(generateRandomUsername());
    }
  }, [providedUsername]);

  if (!username) return null;

  return (
    <motion.div
      className={`w-full rounded-xl shadow-md overflow-hidden transition-all duration-300
        ${
          isOwner
            ? "bg-white border border-blue-200 shadow-blue-100/50"
            : "bg-white border border-gray-100"
        }
        ${isNew ? "shadow-lg ring-2 ring-red-200" : ""}
        hover:shadow-lg`}
      initial={
        isNew
          ? { opacity: 0, y: -20, scale: 0.95 }
          : { opacity: 1, y: 0, scale: 1 }
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Card Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <User size={16} />
          </div>
          <span className="text-sm font-semibold text-gray-700">
            @{username}
          </span>
        </div>

        {isOwner && (
          <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center">
            <span className="h-1.5 w-1.5 bg-blue-500 rounded-full mr-1.5 animate-pulse"></span>
            You
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="relative">
        {type === "image" ? (
          <div className="relative">
            <img
              src={file}
              alt="User post"
              className="w-full h-64 object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
        ) : (
          <div className="p-4 min-h-[100px]">
            <p className="text-gray-800 text-base whitespace-pre-wrap leading-relaxed">
              {file}
            </p>
          </div>
        )}

        {/* Review Status Overlay */}
        {reviewed && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 transition-all duration-300">
            <AlertCircle className="text-amber-400 h-8 w-8" />
            <span className="text-white font-medium text-center px-4">
              This content has been flagged for review
            </span>
            <div className="flex items-center text-white/70 text-xs mt-2 font-medium">
              <Clock size={12} className="mr-1" />
              <span>Under moderation</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
        <span>{new Date().toLocaleDateString()}</span>
        <div className="flex items-center">
          {approved ? (
            <span className="flex items-center text-green-600 mr-2">
              <Shield size={12} className="mr-1" />
              <span>Approved</span>
            </span>
          ) : null}
          <span>{type === "image" ? "Image Post" : "Text Post"}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;
