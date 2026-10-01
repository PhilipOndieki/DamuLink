"use client";

import { useEffect, useRef } from "react";
import type { Facility, MatchRequest } from "@/types";

interface FacilityMapProps {
  facility: Facility;
  allFacilities: Facility[];
  activeMatches: MatchRequest[];
}

/**
 * Leaflet map showing facility location and active match routes as dotted lines.
 * Uses dynamic import to avoid SSR issues with Leaflet.
 */
export function FacilityMap({
  facility,
  allFacilities,
  activeMatches,
}: FacilityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const L = (await import("leaflet")).default;

      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView(
        [facility.lat, facility.lng],
        10
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Red marker for current facility
      const redIcon = L.divIcon({
        html: `<div style="width:14px;height:14px;background:#CC0000;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
        className: "",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker([facility.lat, facility.lng], { icon: redIcon })
        .addTo(map)
        .bindPopup(`<strong>${facility.name}</strong><br/>${facility.county}`);

      // Grey markers for other facilities
      const greyIcon = L.divIcon({
        html: `<div style="width:10px;height:10px;background:#6B7280;border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
        className: "",
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      for (const f of allFacilities) {
        if (f.id === facility.id) continue;
        L.marker([f.lat, f.lng], { icon: greyIcon })
          .addTo(map)
          .bindPopup(`<strong>${f.name}</strong><br/>${f.county}`);
      }

      // Draw dotted lines for active match routes
      for (const match of activeMatches) {
        if (
          match.status !== "pending" &&
          match.status !== "confirmed" &&
          match.status !== "in_transit"
        )
          continue;

        const donorFacility = allFacilities.find(
          (f) => f.id === match.donor_facility_id
        );
        const receiverFacility = allFacilities.find(
          (f) => f.id === match.receiver_facility_id
        );

        if (!donorFacility || !receiverFacility) continue;

        L.polyline(
          [
            [donorFacility.lat, donorFacility.lng],
            [receiverFacility.lat, receiverFacility.lng],
          ],
          {
            color: "#CC0000",
            weight: 2,
            dashArray: "6 8",
            opacity: 0.7,
          }
        ).addTo(map);
      }

      mapInstanceRef.current = map;

      cleanup = () => {
        map.remove();
        mapInstanceRef.current = null;
      };
    })();

    return () => cleanup?.();
  }, [facility, allFacilities, activeMatches]);

  return (
    <div
      ref={mapRef}
      className="w-full h-72 rounded-lg overflow-hidden border border-gray-200"
      aria-label="Facility location map"
    />
  );
}
