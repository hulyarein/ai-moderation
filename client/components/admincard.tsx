import React from "react";

type AdminPostCardProps = {
  file: string;
  type: "text" | "image";
  classification: "Fake Image" | "Toxic Content" | "Explicit Content";
  onRemove: () => void;
  onMarkFalsePositive: () => void;
};

const classificationColors: Record<string, string> = {
  "Fake Image": "bg-red-100 text-red-800",
  "Toxic Content": "bg-blue-100 text-blue-800",
  "Explicit Content": "bg-amber-100 text-amber-800",
};

const AdminPostCard: React.FC<AdminPostCardProps> = ({
  file,
  type,
  classification,
  onRemove,
  onMarkFalsePositive,
}) => {
  return (
    <div className="w-full bg-white flex flex-col items-center">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-4 flex flex-col gap-2 border border-gray-200">
        {/* Classification Tag */}
        <div
          className={`text-s font-semibold px-4 py-1 rounded-full self-start ${classificationColors[classification]}`}
        >
          {classification}
        </div>

        {/* Post Content */}
        {type === "image" ? (
          <img
            src={file}
            alt="Post"
            className="w-full h-48 object-cover rounded-md m-0"
          />
        ) : (
          <p className="text-gray-800">{file}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-auto">
          <button
            onClick={onRemove}
            className="text-white bg-gray-500 hover:bg-gray-600 px-3 py-1 rounded text-sm"
          >
            Remove
          </button>
          <button
            onClick={onMarkFalsePositive}
            className="text-white border bg-green-600 hover:bg-green-800 px-3 py-1 rounded text-sm"
          >
            False Positive
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPostCard;
