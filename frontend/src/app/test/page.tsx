"use client";

import React, { useState } from "react";

const Page = () => {
  const [maxNumber, setMaxNumber] = useState(10000);
  const [randomNumber, setRandomNumber] = useState(null);

  const generateRandomNumber = () => {
    const newRandom = Math.floor(Math.random() * (maxNumber + 1));
    setRandomNumber(newRandom);
  };

  return (
    <div className="mt-24 p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Random Number Generator
      </h2>

      <div className="mb-4">
        <label
          htmlFor="maxNumber"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Maximum Number (0-10000):
        </label>
        <input
          type="number"
          id="maxNumber"
          value={maxNumber}
          onChange={(e) =>
            setMaxNumber(
              Math.min(10000, Math.max(0, parseInt(e.target.value) || 0)),
            )
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          min="0"
          max="10000"
        />
      </div>

      <button
        onClick={generateRandomNumber}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
      >
        Generate Random Number
      </button>

      {randomNumber !== null && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <p className="text-lg font-semibold text-center">
            Your random number:{" "}
            <span className="text-blue-600">{randomNumber}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default Page;
