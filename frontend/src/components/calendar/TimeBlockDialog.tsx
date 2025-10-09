import React, { useState, useEffect } from 'react';
import type { ParsedTask } from '../../services/taskService';
import { minutesToTime, calculateDuration } from '../../utils/timeBlockUtils';

interface TimeBlockDialogProps {
  task: ParsedTask;
  date: Date;
  initialTime?: string; // Optional initial start time (e.g., "09:00")
  onSave: (timeBlock: { start: string; end: string; duration: number }) => void;
  onCancel: () => void;
}

type InputMethod = 'preset' | 'range' | 'duration';

/**
 * Parse duration from text input
 * Supports formats: "2h 30m", "90m", "1.5h"
 */
const parseDuration = (input: string): number => {
  const trimmed = input.trim().toLowerCase();

  // Try "2h 30m" or "2h30m" format
  const hoursMinutesMatch = trimmed.match(/(\d+\.?\d*)h\s*(\d+)?m?/);
  if (hoursMinutesMatch) {
    const hours = parseFloat(hoursMinutesMatch[1]);
    const minutes = hoursMinutesMatch[2] ? parseInt(hoursMinutesMatch[2]) : 0;
    return Math.floor(hours * 60 + minutes);
  }

  // Try "90m" format
  const minutesMatch = trimmed.match(/^(\d+)m$/);
  if (minutesMatch) {
    return parseInt(minutesMatch[1]);
  }

  // Try decimal hours "1.5h"
  const decimalHoursMatch = trimmed.match(/^(\d+\.?\d*)h$/);
  if (decimalHoursMatch) {
    return Math.floor(parseFloat(decimalHoursMatch[1]) * 60);
  }

  // Try just a number (assume minutes)
  const numberMatch = trimmed.match(/^(\d+)$/);
  if (numberMatch) {
    return parseInt(numberMatch[1]);
  }

  return 60; // Default to 1 hour
};

/**
 * Calculate end time from start time and duration
 */
const calculateEndTime = (start: string, durationMinutes: number): string => {
  const [hours, minutes] = start.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + durationMinutes;
  return minutesToTime(endMinutes);
};

export const TimeBlockDialog: React.FC<TimeBlockDialogProps> = ({
  task,
  date,
  initialTime,
  onSave,
  onCancel,
}) => {
  const [method, setMethod] = useState<InputMethod>('preset');
  const [start, setStart] = useState(initialTime || '09:00');
  const [end, setEnd] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [durationInput, setDurationInput] = useState('1h');

  // Update end time when start or duration changes
  useEffect(() => {
    if (method === 'preset' || method === 'duration') {
      setEnd(calculateEndTime(start, duration));
    }
  }, [start, duration, method]);

  // Update duration when start or end changes
  useEffect(() => {
    if (method === 'range') {
      const calculatedDuration = calculateDuration(start, end);
      setDuration(calculatedDuration);
    }
  }, [start, end, method]);

  const handleDurationInputChange = (value: string) => {
    setDurationInput(value);
    const parsed = parseDuration(value);
    setDuration(parsed);
  };

  const handleSave = () => {
    onSave({ start, end, duration });
  };

  const presetDurations = [
    { label: '30 min', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '1.5 hours', minutes: 90 },
    { label: '2 hours', minutes: 120 },
    { label: '3 hours', minutes: 180 },
    { label: '4 hours', minutes: 240 },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Create Time Block
        </h3>

        {/* Task info */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-300">Task:</p>
          <p className="font-medium text-gray-900 dark:text-white">{task.text}</p>
        </div>

        {/* Start time input (always visible) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Time
          </label>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Method selector tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            onClick={() => setMethod('preset')}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              method === 'preset'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Preset
          </button>
          <button
            onClick={() => setMethod('range')}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              method === 'range'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Time Range
          </button>
          <button
            onClick={() => setMethod('duration')}
            className={`flex-1 py-2 px-4 text-sm font-medium ${
              method === 'duration'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Duration
          </button>
        </div>

        {/* Method-specific inputs */}
        <div className="mb-6">
          {/* Preset buttons */}
          {method === 'preset' && (
            <div className="grid grid-cols-3 gap-2">
              {presetDurations.map((preset) => (
                <button
                  key={preset.minutes}
                  onClick={() => setDuration(preset.minutes)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    duration === preset.minutes
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          {/* Time range inputs */}
          {method === 'range' && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Duration input */}
          {method === 'duration' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration
              </label>
              <input
                type="text"
                value={durationInput}
                onChange={(e) => handleDurationInputChange(e.target.value)}
                placeholder="e.g., 2h 30m, 90m, 1.5h"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Examples: 2h 30m, 90m, 1.5h
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <span className="font-medium">Time Block:</span> {start} - {end} ({duration} minutes)
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Create Time Block
          </button>
        </div>
      </div>
    </div>
  );
};
