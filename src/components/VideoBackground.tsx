import React from "react";

export const VideoBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 h-screen w-screen overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full object-cover brightness-[0.4]"
      >
        <source src="/assets/video/bg.mp4" type="video/mp4" />
      </video>
      {/* Darker overlay for better readability */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
    </div>
  );
};
