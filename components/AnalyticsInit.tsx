"use client";

import { useEffect } from "react";
import { initAnalytics, trackPageView } from "@/lib/analytics/tracking";

interface AnalyticsInitProps {
  enabled: boolean;
}

export default function AnalyticsInit({ enabled }: AnalyticsInitProps) {
  useEffect(() => {
    initAnalytics(enabled);
    if (enabled) {
      trackPageView();
    }
  }, [enabled]);

  return null;
}
