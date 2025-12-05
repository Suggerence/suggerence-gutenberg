"use client";

import { useEffect, useRef, useState } from "react";
import { Shimmer } from "./shimmer";

const THINKING_WORDS = [
  "Consulting the Codex...",
  "Hooking into inspiration...",
  "Querying the loop of ideas...",
  "Aligning inner blocks...",
  "Summoning blocks...",
  "Optimizing block tree...",
  "Registering new thoughts...",
  "Minifying problems...",
  "Applying filters to reality...",
  "Rewriting rewrites...",
  "Activating block mode...",
  "Rendering possibilities...",
  "Refactoring patterns...",
  "Hydrating inspiration...",
  "Escaping recursive thoughts...",
  "Sanitizing the mind...",
  "Resetting brain permalinks...",
  "Extending consciousness...",
  "Parsing inspiration...",
  "Plugging into creativity...",
  "Meta-boxing ideas...",
  "Featuring thoughts...",
  "Block-storming...",
  "Enqueuing ideas...",
  "Filtering self-doubt...",
  "Iterating possibilities...",
  "REST-ing for a moment...",
  "Getting closer to AGI...",
  "Trashing doubts...",
  "Unblocking ideas...",
  "Registering custom insights...",
  "Wrapping blocks...",
  "Flushing mental cache...",
  "Localizing insights...",
  "Transient thoughts forming...",
  "Serializing wisdom...",
  "Nonce-checking reality...",
  "Scheduling thoughts...",
  "Shortcode-ing the problem...",
  "Becoming one with the blocks...",
  "Taxonomizing concepts...",
  "Caching brilliance...",
  "Plugin some thoughts...",
  "Archiving old assumptions...",
  "Categorizing chaos...",
  "Revisioning the approach...",
  "Tagging insights...",
  "Slug-ging through...",
  "Thinking outside the blocks...",
  "I'll loop you in shortly...",
];

interface ThinkingWordsProps {
  duration?: number;
  changeInterval?: number;
}

export const ThinkingWords = ({
  duration = 1,
  changeInterval = 2000
}: ThinkingWordsProps) => {
  // Use ref to store the initial word so it persists across re-renders
  const initialWordRef = useRef<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Initialize with the stable initial word
  const [currentWord, setCurrentWord] = useState<string>(() => {
    if (initialWordRef.current === null) {
      const randomIndex = Math.floor(Math.random() * THINKING_WORDS.length);
      initialWordRef.current = THINKING_WORDS[randomIndex];
    }
    return initialWordRef.current;
  });

  useEffect(() => {
    // Only set up the interval once on mount
    if (intervalRef.current === null) {
      intervalRef.current = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * THINKING_WORDS.length);
        setCurrentWord(THINKING_WORDS[randomIndex]);
      }, changeInterval);
    }

    // Clean up only on unmount
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return (
    <Shimmer duration={duration}>
      {currentWord}
    </Shimmer>
  );
};
