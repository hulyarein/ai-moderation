"use client";
import PostCard from "@/components/postcard";
import PostModal from "@/components/postmodal";
import React, { useState } from "react";

type Post = {
  file: string;
  type: "image" | "text";
};

export default function Page() {
  const [modalOpen, setModalOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([
    {
      file: "https://i.pinimg.com/736x/5b/d0/d9/5bd0d9def4d48d8ad5fe03ba2be27acd.jpg",
      type: "image",
    },
    {
      file: "Today I went to the park and saw the most amazing sunset!",
      type: "text",
    },
    {
      file: "https://i.pinimg.com/736x/a3/52/fc/a352fce9be482c9021a0f23227f7d051.jpg",
      type: "image",
    },
    {
      file: "Today I went to the park and saw the most amazing sunset!",
      type: "text",
    },
  ]);

  const handleAddPost = (newPost: Post) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  return (
    <div className="min-h-screen bg-white flex w-full">
      <PostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddPost}
      />
      <div
        className="w-2/5 h-screen flex flex-col items-center border-0 rounded-tr-3xl rounded-br-3xl p-6 justify-between bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://i.pinimg.com/736x/b3/52/70/b35270039cd08b7aa332a3e95d9953af.jpg')",
        }}
      >
        <h1 className="text-white font-bold text-3xl">Welcome, User!</h1>
        <button
          className="w-2/3 h-12 rounded-lg border-white bg-white text-red-900 font-bold text-2xl hover:bg-black hover:text-white"
          onClick={() => setModalOpen(true)}
        >
          Create post
        </button>
      </div>
      <div className="flex flex-col gap-10 p-6 items-center w-4/5 bg-white h-screen overflow-y-auto">
        {posts.map((post, idx) => (
          <PostCard key={idx} file={post.file} type={post.type} />
        ))}
      </div>
    </div>
  );
}
