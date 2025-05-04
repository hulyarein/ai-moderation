"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, User, Shield } from "lucide-react";
import { generateRandomUsername } from "@/utils/usernameGenerator";
import Image from "next/image";

type PostCardProps = {
  file: string;
  type: "image" | "text";
  reviewed: boolean;
  approved?: boolean;
  isOwner?: boolean;
  username?: string | null;
  isNew?: boolean;
  profile?: string; // Add profile picture prop
};

const PostCard: React.FC<PostCardProps> = ({
  file,
  type,
  reviewed,
  approved = true,
  isOwner = false,
  username: providedUsername,
  isNew = false,
  profile, // Add profile picture parameter
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
      <div className="relative">
        {/* Card Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden">
              {profile ? (
                <Image
                  src={profile}
                  alt={`${username}'s profile`}
                  className="h-full w-full object-cover"
                  width={32}
                  height={32}
                />
              ) : (
                <>
                  <User size={14} className="sm:hidden" />
                  <User size={16} className="hidden sm:block" />
                </>
              )}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
              @{username}
            </span>
          </div>

          {isOwner && (
            <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center">
              <span className="h-1 sm:h-1.5 w-1 sm:w-1.5 bg-blue-500 rounded-full mr-1 sm:mr-1.5 animate-pulse"></span>
              You
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="relative">
          {type === "image" ? (
            <div className="relative bg-gray-100 aspect-square flex justify-center items-center">
              <Image
                src={file}
                alt="User post"
                className={`max-w-full max-h-full object-contain ${
                  reviewed ? "opacity-30" : ""
                }`}
                width={400}
                height={400}
                priority={isNew}
              />
              <div className="absolute bottom-0 left-0 right-0 h-8 sm:h-12 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
          ) : (
            <div className="p-3 sm:p-4 min-h-[80px] sm:min-h-[100px]">
              <p className="text-gray-800 text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                {file}
              </p>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
          <span>{new Date().toLocaleDateString()}</span>
          <div className="flex items-center">
            {approved && !reviewed ? (
              <span className="flex items-center text-green-600 mr-2">
                <Shield size={10} className="sm:hidden mr-1" />
                <Shield size={12} className="hidden sm:block mr-1" />
                <span>Approved</span>
              </span>
            ) : null}
            <span>{type === "image" ? "Image Post" : "Text Post"}</span>
          </div>
        </div>

        {/* Review Status Overlay */}
        {reviewed && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center transition-all duration-300 rounded-xl z-10">
            <div className="text-center w-full p-3 sm:p-0">
              <AlertCircle className="text-amber-400 h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3" />
              <div className="text-white font-medium px-2 sm:px-4 text-center text-base sm:text-lg">
                This content is under review
              </div>
              <div className="text-white/70 text-xs sm:text-sm mt-2 sm:mt-3">
                Awaiting moderation
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PostCard;
