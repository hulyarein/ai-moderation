change: "use client";

import React, { useMemo, useEffect, useState } from "react";

type PostCardProps = {
  file: string;
  type: "image" | "text";
  reviewed: boolean;
};

const usernames = [
  "coolcat123",
  "sunnyvibes",
  "pixelpanda",
  "moonwalker",
  "codejunkie",
  "dreamer99",
  "staticstorm",
  "coffeequeen",
  "lazygenius",
  "ghostwriter",
];

const getRandomUsername = () => {
  return usernames[Math.floor(Math.random() * usernames.length)];
};

const PostCard: React.FC<PostCardProps> = ({ file, type, reviewed }) => {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setUsername(getRandomUsername());
  }, []);

  if (!username) return null;

  return (
    <div className="max-w-sm w-full bg-white rounded-2xl shadow-md p-4 space-y-3 border">
      <div className="text-sm font-medium text-gray-600">@{username}</div>

      <div className="relative">
        {/* Post content */}
        {type === "image" ? (
          <img
            src={file}
            alt="User post"
            className="w-full h-64 object-cover rounded-lg"
          />
        ) : (
          <p className="text-gray-800 text-base whitespace-pre-wrap">{file}</p>
        )}

        {/* Reviewed Overlay */}
        {reviewed && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <span className="text-white font-semibold text-lg">Reviewed</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
