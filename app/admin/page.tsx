"use client";
import AdminPostCard from "@/components/admincard";

export default function Page() {
  return (
    <div className="w-screen min-h-screen bg-white flex flex-col space-y-4">
      <nav
        className="sticky top-0 z-50 shadow-md py-4 px-6 flex justify-center border-b border-gray-200   "
        style={{
          backgroundImage:
            "url('https://i.pinimg.com/736x/b3/52/70/b35270039cd08b7aa332a3e95d9953af.jpg')",
        }}
      >
        <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
      </nav>
      <div className="space-y-6">
        <AdminPostCard
          file="https://i.pinimg.com/736x/5b/d0/d9/5bd0d9def4d48d8ad5fe03ba2be27acd.jpg"
          type="image"
          classification="Fake Image"
          onRemove={() => console.log("Removed")}
          onMarkFalsePositive={() => console.log("Marked as false positive")}
        />

        <AdminPostCard
          type="text"
          classification="Toxic Content"
          file="This is an example of a harmful or toxic text post."
          onRemove={() => console.log("Removed")}
          onMarkFalsePositive={() => console.log("Marked as false positive")}
        />

        <AdminPostCard
          file="https://i.pinimg.com/736x/5b/d0/d9/5bd0d9def4d48d8ad5fe03ba2be27acd.jpg"
          type="image"
          classification="Fake Image"
          onRemove={() => console.log("Removed")}
          onMarkFalsePositive={() => console.log("Marked as false positive")}
        />
      </div>
    </div>
  );
}
