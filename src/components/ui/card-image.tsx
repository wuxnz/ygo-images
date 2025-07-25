"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";

interface CardImageProps {
  cardId: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function CardImage({
  cardId,
  alt,
  className = "",
  width = 100,
  height = 146,
}: CardImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  const imagePath = `/images/${cardId}.jpg`;

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (imageError || isLoading) return;

    const rect = e.currentTarget.getBoundingClientRect();

    // Calculate popup position to avoid going off-screen
    const popupWidth = 400;
    const popupHeight = 584; // Maintain card aspect ratio

    let x = rect.right + 10; // 10px offset from the card
    let y = rect.top;

    // Adjust if popup would go off the right edge
    if (x + popupWidth > window.innerWidth) {
      x = rect.left - popupWidth - 10;
    }

    // Adjust if popup would go off the bottom edge
    if (y + popupHeight > window.innerHeight) {
      y = window.innerHeight - popupHeight - 10;
    }

    // Ensure popup doesn't go off the top edge
    if (y < 0) {
      y = 10;
    }

    setPopupPosition({ x, y });
    setShowPopup(true);
  };

  const handleMouseLeave = () => {
    setShowPopup(false);
  };

  const renderPopup = () => {
    if (!showPopup || imageError || isLoading || typeof window === "undefined")
      return null;

    return createPortal(
      <div
        className="pointer-events-none fixed z-50"
        style={{
          left: popupPosition.x,
          top: popupPosition.y,
        }}
      >
        <div className="bg-background animate-in fade-in-0 zoom-in-95 rounded-lg border p-2 shadow-lg duration-150">
          <Image
            src={imagePath}
            alt={alt || `Card ${cardId}`}
            width={400}
            height={584}
            className="rounded object-cover"
            unoptimized
            priority
          />
        </div>
      </div>,
      document.body,
    );
  };

  if (imageError) {
    return (
      <div
        className={`bg-muted border-muted-foreground/20 flex items-center justify-center rounded-md border-2 border-dashed ${className}`}
        style={{ width, height }}
      >
        <div className="p-2 text-center">
          <div className="text-muted-foreground/60 font-mono text-xs">
            {cardId}
          </div>
          <div className="text-muted-foreground/40 mt-1 text-[10px]">
            No Image
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={imageRef}
        className={`relative cursor-pointer ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isLoading && (
          <div
            className="bg-muted absolute inset-0 flex items-center justify-center rounded-md"
            style={{ width, height }}
          >
            <div className="text-muted-foreground/60 text-xs">Loading...</div>
          </div>
        )}
        <Image
          src={imagePath}
          alt={alt || `Card ${cardId}`}
          width={width}
          height={height}
          className={`rounded-md object-cover ${isLoading ? "invisible" : "visible"}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          unoptimized
        />
      </div>
      {renderPopup()}
    </>
  );
}
