"use client";

import { useEffect, useRef } from "react";
import type { Facility } from "@/types";

interface AdminMapProps {
  facilities: Facility[];
}

/** County-level heatmap showing facility locations and trust scores across Kenya */
export function AdminMap({ facilities }: AdminMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const L = (await import("leaflet")).default;

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

      const map = L.map(mapRef.current!).setView([-0.023559, 37.906193], 6);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      for (const facility of facilities) {
        // Color by trust score: green (high) → yellow (medium) → red (low)
        const score = facility.trust_score;
        const color =
          score >= 8
            ? "#16a34a"
            : score >= 6
            ? "#d97706"
            : "#dc2626";

        const icon = L.divIcon({
          html: `
            <div style="
              width:20px;height:20px;
              background:${color};
              border:2px solid white;
              border-radius:50%;
              box-shadow:0 2px 6px rgba(0,0,0,0.35);
              display:flex;align-items:center;justify-content:center;
              color:white;font-size:9px;font-weight:700
            ">${score.toFixed(0)}</div>`,
          className: "",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        L.marker([facility.lat, facility.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<strong>${facility.name}</strong><br/>
             County: ${facility.county}<br/>
             Trust Score: <b>${facility.trust_score}/10</b>`
          );
      }

      mapInstanceRef.current = map;
      cleanup = () => {
        map.remove();
        mapInstanceRef.current = null;
      };
    })();

    return () => cleanup?.();
  }, [facilities]);

  return (
    <div
      ref={mapRef}
      className="w-full h-80 rounded-lg overflow-hidden border border-gray-200"
      aria-label="Kenya facility heatmap"
    />
  );
}
