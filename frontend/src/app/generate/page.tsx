"use client";

import React, { useState } from "react";

interface Transfer {
  amount: string;
  from: { id: string };
  to: { id: string };
  blockNumber: number;
  timestamp: number;
}

interface TransferStats {
  totalCount: number;
  frequencyMetric: number;
  topAmounts: { amount: number; count: number }[];
  totalDOT: number;
}

interface MusicParams {
  bpm: number;
  drumIntensity: number;
  specialMoments: {
    timestamp: number;
    intensity: number;
    amount: number;
    count: number;
  }[];
  baseFrequency: number;
  scale: string;
}

const TransfersPage = () => {
  const [blockNumber, setBlockNumber] = useState<number>(0); // Using number
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<Transfer[] | null>(null);
  const [transferStats, setTransferStats] = useState<TransferStats>({
    totalCount: 0,
    frequencyMetric: 0,
    topAmounts: [],
    totalDOT: 0,
  });
  const [musicParams, setMusicParams] = useState<MusicParams>({
    bpm: 120,
    drumIntensity: 0.5,
    specialMoments: [],
    baseFrequency: 440,
    scale: "minor",
  });
  const [musicResults, setMusicResults] = useState<string | null>(null);

  const fetchTransfers = async () => {
    setLoading(true);
    setError(null);

    // GraphQL query
    const query = `
      query GetTransfers($blockNumber: Int, $limit: Int = 5000) {
        transfers(
          where: { blockNumber_gte: $blockNumber }
          limit: $limit
          orderBy: blockNumber_ASC
        ) {
          amount
          from {
            id
          }
          to {
            id
          }
          blockNumber
          timestamp
        }
      }
    `;

    const variables = {
      blockNumber: blockNumber, // Pass number directly
      limit: 5000,
    };

    try {
      const response = await fetch("http://localhost:4350/graphQL", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const data = await response.json();
      console.log("GraphQL Response:", data);

      if (data.errors) {
        setError(data.errors[0].message);
        console.error("GraphQL Errors:", data.errors);
      } else {
        const transfers = data.data.transfers;
        setTransfers(transfers);

        // Calculate statistics
        calculateTransferStatistics(transfers);
      }

      setLoading(false);
      return data;
    } catch (err: any) {
      console.error("Fetch Error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBlockNumber(Number(e.target.value));
  };

  const formatAmount = (amount: string) => {
    return parseFloat(amount) / 1000000000000 + " DOT";
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateAddress = (address: { id: string }) => {
    if (!address || !address.id) return "";
    return `${address.id.substring(0, 8)}...${
      address.id.substring(address.id.length - 8)
    }`;
  };

  const calculateTransferStatistics = (transfers: Transfer[]) => {
    if (!transfers || transfers.length === 0) {
      setTransferStats({
        totalCount: 0,
        frequencyMetric: 0,
        topAmounts: [],
        totalDOT: 0,
      });
      setMusicParams({
        bpm: 120,
        drumIntensity: 0.5,
        specialMoments: [],
        baseFrequency: 440,
        scale: "minor",
      });
      return;
    }

    const totalCount = transfers.length;

    const recipientFrequency: { [key: string]: number } = {};
    transfers.forEach((transfer) => {
      const toAddress = transfer.to.id;
      recipientFrequency[toAddress] = (recipientFrequency[toAddress] || 0) + 1;
    });
    const frequencies = Object.values(recipientFrequency);
    frequencies.sort((a, b) => b - a);
    const frequencyMetric = frequencies.length > 0
      ? frequencies[Math.floor(frequencies.length / 2)]
      : 0;
    const amountFrequency: { [key: string]: number } = {};
    let totalDOT = 0;

    transfers.forEach((transfer) => {
      const amountInDOT = parseFloat(transfer.amount) / 1000000000000;
      totalDOT += amountInDOT;

      const roundedAmount = amountInDOT.toFixed(2);
      amountFrequency[roundedAmount] = (amountFrequency[roundedAmount] || 0) +
        1;
    });

    const amountEntries = Object.entries(amountFrequency);
    const topAmounts = amountEntries
      .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
      .slice(0, 5)
      .map(([amount, count]) => ({ amount: parseFloat(amount), count }));

    setTransferStats({
      totalCount,
      frequencyMetric,
      topAmounts,
      totalDOT: parseFloat(totalDOT.toFixed(6)),
    });

    calculateMusicParameters(totalCount, frequencyMetric, totalDOT, topAmounts);
  };

  const calculateMusicParameters = (
    totalCount: number,
    frequencyMetric: number,
    totalDOT: number,
    topAmounts: { amount: number; count: number }[],
  ) => {
    const rawBPM = Math.min(180, Math.max(80, (totalCount / 60) * 60));
    const bpm = Math.round(rawBPM);

    const maxExpectedDOT = 1000;
    const drumIntensity = Math.min(
      1,
      Math.log(totalDOT + 1) / Math.log(maxExpectedDOT + 1),
    );

    const specialMoments: {
      timestamp: number;
      intensity: number;
      amount: number;
      count: number;
    }[] = [];
    const songDuration = 60;

    if (topAmounts.length > 0) {
      const maxAmount = topAmounts[0].amount;

      topAmounts.forEach((item, index) => {
        const timestamp = (index + 1) *
          (songDuration / (topAmounts.length + 1));

        const relativeValue = item.amount / maxAmount;
        const countWeight = Math.min(1, item.count / 10);

        specialMoments.push({
          timestamp: parseFloat(timestamp.toFixed(1)),
          intensity: parseFloat(
            (relativeValue * 0.7 + countWeight * 0.3).toFixed(2),
          ),
          amount: item.amount,
          count: item.count,
        });
      });
    }

    const baseFrequency = Math.min(
      880,
      Math.max(220, 440 + (frequencyMetric - 1) * 40),
    );

    const averageTransactionSize = totalDOT / totalCount;
    const scale = averageTransactionSize > 20 ? "major" : "minor";

    setMusicParams({
      bpm,
      drumIntensity,
      specialMoments,
      baseFrequency: Math.round(baseFrequency),
      scale,
    });
  };

  const generateMusic = async () => {
    if (!transfers || transfers.length === 0) {
      setError("No transfer data available to generate music");
      return;
    }

    try {
      const firstTransfer = transfers[0];
      const transferDate = new Date(firstTransfer.timestamp);
      const formattedDate = `${transferDate.getDate()} ${
        transferDate.toLocaleString("default", { month: "long" })
      } ${transferDate.getFullYear()}`;

      const query =
        `Create 4 very short verses about Polkadot blockchain events from ${formattedDate}. Each verse must be extremely concise. Total response must be under 200 characters.

      Format exactly as:

      V1: [5-word verse]
      V2: [5-word verse]
      V3: [5-word verse]
      V4: [5-word verse]

      META:
      GENRE: ${
          musicParams.bpm >= 160
            ? "EDM"
            : musicParams.bpm >= 120
            ? "HIP-HOP"
            : musicParams.bpm >= 90
            ? "POP"
            : "CHILL"
        }
      BPM: ${musicParams.bpm}
      SCALE: ${musicParams.scale.toUpperCase()}`;

      console.log("Executing query:", query);
      setLoading(true);
      setMusicResults(null);

      const response = await fetch("/api/generate-music", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate music");
      }

      setMusicResults(data.result);

      console.log("Results received:", data.result);
    } catch (err: any) {
      console.error("Error generating music:", err);
      if (err instanceof Error) {
        setError(`Error generating music: ${err.message}`);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-24">
      <div className="max-w-6xl mx-auto ">
        <h1 className="text-3xl font-bold mb-8">Transfers Explorer</h1>

        <div className="mb-8 flex items-end gap-4">
          <div className="flex-grow max-w-md">
            <label className="block text-sm font-medium mb-2">
              Block Number
              <input
                type="number"
                value={blockNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </label>
          </div>
          <button
            onClick={fetchTransfers}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-300 transition-colors"
          >
            {loading ? "Loading..." : "Fetch Transfers"}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-md">
            Error: {error}
          </div>
        )}

        {transfers && (
          <div>
            {/* Statistics Summary */}
            <div className="mb-8 grid grid-cols-1 gap-6 bg-gray-900/30 p-6 rounded-lg border border-gray-800">
              <h2 className="text-xl font-semibold border-b border-gray-700 pb-2 mb-4">
                Transfer Statistics of{" "}
                <span className="text-blue-300">{blockNumber}</span>
                {transfers && transfers.length > 0 && (
                  <span className="text-sm font-normal text-gray-400 ml-2">
                    (First transfer:{" "}
                    {new Date(transfers[0].timestamp).toLocaleString()})
                  </span>
                )}
              </h2>

              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {/* Total Count */}
                <div className="bg-gray-900/50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    Total Transfers
                  </h3>
                  <p className="text-2xl font-bold">
                    {transferStats.totalCount}
                  </p>
                </div>

                {/* Frequency Metric */}
                <div className="bg-gray-900/50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    Recipient Frequency
                  </h3>
                  <p className="text-2xl font-bold">
                    {transferStats.frequencyMetric}
                  </p>
                  <p className="text-xs text-gray-500">
                    Median occurrences per recipient
                  </p>
                </div>

                {/* Total DOT */}
                <div className="bg-gray-900/50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    Total DOT
                  </h3>
                  <p className="text-2xl font-bold">{transferStats.totalDOT}</p>
                </div>

                {/* Top Amounts */}
                <div className="bg-gray-900/50 p-4 rounded-md col-span-1 md:col-span-1">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">
                    Top Amounts
                  </h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="text-left pb-1">Amount (DOT)</th>
                        <th className="text-right pb-1">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transferStats.topAmounts.map((item, index) => (
                        <tr key={index}>
                          <td className="py-1">{item.amount}</td>
                          <td className="py-1 text-right">{item.count}x</td>
                        </tr>
                      ))}
                      {transferStats.topAmounts.length === 0 && (
                        <tr>
                          <td
                            colSpan={2}
                            className="py-1 text-center text-gray-500"
                          >
                            No data
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Music Generation Parameters */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-medium mb-4">Music Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* BPM */}
                  <div className="bg-gray-900/50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">
                      Beat Speed (BPM)
                    </h4>
                    <p className="text-2xl font-bold">{musicParams.bpm}</p>
                    <p className="text-xs text-gray-500">
                      Based on transfers per minute
                    </p>
                  </div>

                  {/* Drum Contrast */}
                  <div className="bg-gray-900/50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">
                      Drum Intensity
                    </h4>
                    <div className="w-full bg-gray-800 rounded-full h-4 mt-2">
                      <div
                        className="bg-blue-600 h-4 rounded-full"
                        style={{ width: `${musicParams.drumIntensity * 100}%` }}
                      >
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Based on total DOT transferred
                    </p>
                  </div>

                  {/* Base Tone */}
                  <div className="bg-gray-900/50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">
                      Base Frequency
                    </h4>
                    <p className="text-xl font-bold">
                      {musicParams.baseFrequency} Hz
                    </p>
                    <p className="text-xs text-gray-500">
                      Scale: {musicParams.scale}
                    </p>
                  </div>
                </div>

                {/* Special Moments Timeline */}
                {musicParams.specialMoments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">
                      Special Instrument Moments
                    </h4>
                    <div className="relative h-12 bg-gray-900/70 rounded-md">
                      {/* Timeline marks */}
                      <div className="absolute inset-x-0 top-0 flex justify-between px-2 text-xs text-gray-500">
                        <span>0s</span>
                        <span>15s</span>
                        <span>30s</span>
                        <span>45s</span>
                        <span>60s</span>
                      </div>

                      {/* Event markers */}
                      {musicParams.specialMoments.map((moment, index) => (
                        <div
                          key={index}
                          className="absolute bottom-0 w-3 rounded-t-md bg-yellow-500"
                          style={{
                            height: `${moment.intensity * 100}%`,
                            left: `calc(${
                              (moment.timestamp / 60) * 100
                            }% - 6px)`,
                          }}
                          title={`${moment.timestamp}s: ${moment.amount} DOT (${moment.count}x)`}
                        >
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Based on top transaction amounts; higher spikes indicate
                      larger transactions.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Transfers Table */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
                Transfers
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800 bg-gray-900/20 rounded-lg">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        Block
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        From
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        To
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {transfers.map((transfer) => (
                      <tr key={transfer.blockNumber}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {transfer.blockNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {truncateAddress(transfer.from)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {truncateAddress(transfer.to)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatAmount(transfer.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatTimestamp(transfer.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Music Generation Button and Results */}
            <div className="mt-8">
              <button
                onClick={generateMusic}
                disabled={loading || !transfers}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-300 transition-colors"
              >
                Generate Music
              </button>

              {musicResults && (
                <div className="mt-6 p-4 bg-gray-900/50 border border-gray-700 rounded-md">
                  <h3 className="text-lg font-medium mb-2">Music Output:</h3>
                  <p className="text-gray-300 whitespace-pre-line">
                    {musicResults}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransfersPage;
