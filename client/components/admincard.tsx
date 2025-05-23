import React from "react";
import { AlertTriangle, Check, X, FileText, User, Shield } from "lucide-react";
import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { Post as PostType } from "@/lib/socket";

type AdminPostCardProps = {
  post: PostType & { classification?: string };
  hideActions?: boolean;
  onRemove: () => void;
  onMarkForReview?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
};

const classificationConfig: Record<
  string,
  { bgColor: string; textColor: string; icon: React.ReactNode }
> = {
  "Fake Image": {
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    icon: <AlertTriangle size={16} className="text-red-600" />,
  },
  "Toxic Content": {
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    icon: <AlertTriangle size={16} className="text-blue-600" />,
  },
  "Explicit Content": {
    bgColor: "bg-amber-100",
    textColor: "text-amber-800",
    icon: <AlertTriangle size={16} className="text-amber-600" />,
  },
  Image: {
    bgColor: "bg-purple-100",
    textColor: "text-purple-800",
    icon: <ImageIcon size={16} className="text-purple-600" />,
  },
  "Text Content": {
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
    icon: <FileText size={16} className="text-gray-600" />,
  },
};

// Default config as fallback
const defaultConfig = {
  bgColor: "bg-gray-100",
  textColor: "text-gray-800",
  icon: <AlertTriangle size={16} className="text-gray-600" />,
};

const AdminPostCard: React.FC<AdminPostCardProps> = ({
  post,
  hideActions = false,
  onRemove,
  onMarkForReview,
  onApprove,
  onReject,
}) => {
  const {
    file,
    type,
    username,
    profile: profilePicture,
    reviewed = false,
    approved = true,
    createdAt,
  } = post;

  const classification =
    post.classification || (type === "image" ? "Image" : "Text Content");

  // Use the config for the classification, or fall back to default if not found
  const config = classificationConfig[classification] || defaultConfig;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col transition-all duration-200 hover:shadow-lg">
      {/* Header with Classification Tag */}
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <div
          className={`font-medium text-sm px-3 py-1 rounded-full flex items-center gap-1.5 ${config.bgColor} ${config.textColor}`}
        >
          {config.icon}
          <span>{classification}</span>
        </div>
        <div className="text-xs text-gray-500 font-medium flex items-center">
          {type === "image" ? (
            <>
              <ImageIcon size={14} className="mr-1" />
              <span>Image</span>
            </>
          ) : (
            <>
              <FileText size={14} className="mr-1" />
              <span>Text</span>
            </>
          )}
        </div>
      </div>

      {/* Status indicators */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
        {username && (
          <div className="flex items-center space-x-2">
            {profilePicture ? (
              <Image
                src={profilePicture}
                alt={`${username}'s profile`}
                className="h-6 w-6 rounded-full object-cover"
                width={24}
                height={24}
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <User size={12} />
              </div>
            )}
            <span className="text-xs font-medium text-gray-700">
              @{username}
            </span>
          </div>
        )}
        <div className="flex items-center">
          {reviewed ? (
            <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center">
              <AlertTriangle size={10} className="mr-1" />
              Under Review
            </span>
          ) : approved ? (
            <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center">
              <Shield size={10} className="mr-1" />
              Approved
            </span>
          ) : (
            <span className="text-xs font-medium bg-red-100 text-red-800 px-2 py-0.5 rounded-full flex items-center">
              <X size={10} className="mr-1" />
              Rejected
            </span>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="p-0">
        {type === "image" ? (
          <div className="relative bg-gray-100 aspect-square flex justify-center items-center">
            <Image
              src={file}
              alt="Post content"
              className="max-w-full max-h-full object-contain"
              width={300}
              height={300}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>

            {/* Review indicator - Modified to be semi-transparent to show content */}
            {reviewed && (
              <div className="absolute top-0 right-0 m-2 bg-amber-500 px-2 py-1 rounded-md flex items-center text-white shadow-md">
                <AlertTriangle className="text-white h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Under Review</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 min-h-[100px] max-h-[200px] overflow-y-auto relative">
            <p className="text-gray-800 text-sm">{file}</p>
          </div>
        )}
      </div>

      {/* Date display - added to show createdAt */}
      {createdAt && (
        <div className="px-3 py-2 text-xs text-gray-500">
          {new Date(createdAt).toLocaleString()}
        </div>
      )}

      {/* Actions */}
      {!hideActions && (
        <div className="p-3 bg-gray-50 flex justify-between items-center gap-2">
          {reviewed ? (
            <>
              {/* Show Safe/Unsafe buttons for posts under review */}
              <button
                onClick={onReject}
                className="flex-1 flex items-center justify-center gap-1.5 text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <X size={16} />
                <span>Unsafe</span>
              </button>
              <button
                onClick={onApprove}
                className="flex-1 flex items-center justify-center gap-1.5 text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Check size={16} />
                <span>Safe</span>
              </button>
            </>
          ) : (
            <>
              {/* Default actions */}
              <button
                onClick={onRemove}
                className="flex-1 flex items-center justify-center gap-1.5 text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <X size={16} />
                <span>Remove</span>
              </button>
              <button
                onClick={onMarkForReview}
                className="flex-1 flex items-center justify-center gap-1.5 text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Check size={16} />
                <span>Flag for Review</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPostCard;
