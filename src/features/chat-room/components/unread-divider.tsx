'use client';

import React from 'react';

export const UnreadDivider = () => {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t-2 border-red-500"></div>
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-4 py-1 text-xs font-medium text-red-500">
          여기까지 읽으셨습니다
        </span>
      </div>
    </div>
  );
};
