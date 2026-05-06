"use client";

import {
  GoogleMap,
  Autocomplete,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useCallback, useState } from "react";

const libraries: "places"[] = ["places"];

type Props = {
  open: boolean;
  subtotal: number;
  onClose: () => void;
  onConfirm: (data: {
    addressLabel: string;
    lat: number;
    lng: number;
    distanceKm: number;
    durationText: string;
    deliveryFee: number;
    promoApplied: boolean;
    promoTitle: string;
  }) => void;
};

const defaultCenter = {
  lat: 62.601,
  lng: 29.7636,
};

function isOutOfRangeMessage(message: string) {
  const value = message.toLowerCase();

  return (
    value.includes("outside") ||
    value.includes("delivery area") ||
    value.includes("delivery range") ||
    value.includes("maximum delivery distance") ||
    value.includes("zero_results") ||
    value.includes("could not be calculated")
  );
}

function isVisibleErrorMessage(message: string) {
  const value = message.toLowerCase();

  return (
    isOutOfRangeMessage(message) ||
    value.includes("failed") ||
    value.includes("denied") ||
    value.includes("error") ||
    value.includes("please") ||
    value.includes("browser")
  );
}

export default function DeliveryLocationModal({
  open,
  subtotal,
  onClose,
  onConfirm,
}: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY || "",
    libraries,
  });

  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  const [address, setAddress] = useState("");
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedByMap, setSelectedByMap] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [outOfRange, setOutOfRange] = useState(false);

  const resetErrorState = useCallback(() => {
    setMessage("");
    setOutOfRange(false);
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!window.google) return `Selected location: ${lat}, ${lng}`;

    return new Promise<string>((resolve) => {
      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results?.[0]?.formatted_address) {
          resolve(results[0].formatted_address);
          return;
        }

        resolve(`Selected location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      });
    });
  }, []);

  async function updateCenterAddress(lat: number, lng: number) {
    const selectedAddress = await reverseGeocode(lat, lng);

    setAddress(selectedAddress);
    setMapCenter({ lat, lng });
    setSelectedByMap(true);
    resetErrorState();
  }

  async function calculateDelivery() {
    setLoading(true);
    resetErrorState();

    try {
      if (!address || !mapCenter.lat || !mapCenter.lng) {
        throw new Error("Please select a delivery location first.");
      }

      const response = await fetch("/api/delivery/google-distance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: mapCenter.lat,
          lng: mapCenter.lng,
          subtotal,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Delivery calculation failed.");
      }

      onConfirm({
        addressLabel: address,
        lat: Number(data.lat || mapCenter.lat),
        lng: Number(data.lng || mapCenter.lng),
        distanceKm: Number(data.distanceKm || 0),
        durationText: data.durationText || "",
        deliveryFee: Number(data.deliveryFee || 0),
        promoApplied: Boolean(data.promoApplied),
        promoTitle: data.promoTitle || "",
      });

      onClose();
    } catch (error: any) {
      const errorMessage = error?.message || "Could not calculate delivery.";

      setMessage(errorMessage);
      setOutOfRange(isOutOfRangeMessage(errorMessage));
    } finally {
      setLoading(false);
    }
  }

  function handlePlaceChanged() {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();

    if (!place.geometry?.location) {
      setMessage("Please select an address from the suggestions.");
      setOutOfRange(false);
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const selectedAddress = place.formatted_address || place.name || "";

    setAddress(selectedAddress);
    setMapCenter({ lat, lng });
    setSelectedByMap(false);
    resetErrorState();
  }

  function useCurrentLocation() {
    resetErrorState();

    if (!navigator.geolocation) {
      setMessage("Your browser does not support location access.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        await updateCenterAddress(lat, lng);
        setLoading(false);
      },
      () => {
        setLoading(false);
        setMessage("Location permission denied. Search or move the map.");
        setOutOfRange(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/65">
      <div className="flex h-dvh w-full items-end justify-center sm:items-center sm:p-4">
        <div className="flex h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-[#f4eee4] shadow-2xl sm:h-[92vh] sm:rounded-3xl">
          <div className="shrink-0 border-b border-[#ddcfba] bg-white px-4 py-4 sm:px-6 sm:py-5">
            <p className="text-[9px] font-black uppercase tracking-[0.32em] text-[#b09876] sm:text-[10px]">
              Delivery Location
            </p>

            <div className="mt-2 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-black leading-tight text-[#3b1f18] sm:text-3xl">
                  Select your delivery address
                </h2>
                <p className="mt-2 text-xs leading-5 text-[#7b6255] sm:text-sm sm:leading-6">
                  Search an address, use current location, or move the map. The
                  pin stays fixed like Foodpanda.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8c9ac] text-2xl text-[#3b1f18]"
              >
                ×
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[380px_1fr]">
            <div className="order-2 flex max-h-[44dvh] shrink-0 flex-col gap-3 overflow-y-auto border-t border-[#ddcfba] bg-[#f4eee4] p-4 md:order-1 md:max-h-none md:border-t-0 md:p-6">
              {isLoaded ? (
                <Autocomplete
                  onLoad={(instance) => setAutocomplete(instance)}
                  onPlaceChanged={handlePlaceChanged}
                  options={{
                    componentRestrictions: { country: "fi" },
                    fields: ["formatted_address", "geometry", "name"],
                  }}
                >
                  <input
                    value={address}
                    onChange={(event) => {
                      setAddress(event.target.value);
                      resetErrorState();
                    }}
                    placeholder="Search address in Joensuu..."
                    className="w-full rounded-2xl border border-[#d8c9ac] bg-white px-4 py-4 text-sm font-bold outline-none focus:border-[#c9a45c]"
                  />
                </Autocomplete>
              ) : (
                <div className="rounded-2xl border border-[#eadfce] bg-white px-4 py-4 text-sm text-[#7b6255]">
                  Loading map search...
                </div>
              )}

              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={loading}
                className="w-full rounded-2xl bg-[#3b1f18] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {loading ? "Checking..." : "Use Current Location"}
              </button>

              {address && (
                <div className="rounded-2xl border border-[#eadfce] bg-white px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#b09876]">
                    Selected Address
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#3b1f18]">
                    {address}
                  </p>
                  {selectedByMap && (
                    <p className="mt-2 text-xs font-semibold text-[#7b6255]">
                      Selected by moving the map.
                    </p>
                  )}
                </div>
              )}

              {message && isVisibleErrorMessage(message) && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
                  {outOfRange
                    ? "This address is outside our delivery range. Please choose another address closer to Ravintola Sinet."
                    : message}
                </p>
              )}

              <button
                type="button"
                onClick={calculateDelivery}
                disabled={loading || !address || outOfRange}
                className="sinet-gold-button w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {outOfRange
                  ? "Outside Delivery Range"
                  : loading
                    ? "Calculating..."
                    : "Confirm Location"}
              </button>
            </div>

            <div className="relative order-1 min-h-0 flex-1 bg-[#eadcc6] md:order-2">
              {isLoaded ? (
                <GoogleMap
                  mapContainerClassName="h-full w-full"
                  center={mapCenter}
                  zoom={15}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                    zoomControl: true,
                    gestureHandling: "greedy",
                  }}
                  onLoad={(map) => {
                    map.addListener("idle", async () => {
                      const center = map.getCenter();
                      if (!center) return;

                      const lat = center.lat();
                      const lng = center.lng();

                      if (
                        Math.abs(lat - mapCenter.lat) < 0.00001 &&
                        Math.abs(lng - mapCenter.lng) < 0.00001
                      ) {
                        return;
                      }

                      const selectedAddress = await reverseGeocode(lat, lng);

                      setMapCenter({ lat, lng });
                      setAddress(selectedAddress);
                      setSelectedByMap(true);
                    });
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-bold text-[#7b6255]">
                  Loading map...
                </div>
              )}

              <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c9a45c] text-xl font-black text-[#3b1f18] shadow-2xl shadow-black/30 ring-4 ring-white">
                    ●
                  </div>
                  <div className="absolute left-1/2 top-[42px] h-4 w-4 -translate-x-1/2 rotate-45 bg-[#c9a45c]" />
                </div>
              </div>

              <div className="absolute left-4 right-4 top-4 z-10 rounded-2xl bg-white/95 px-4 py-3 text-xs font-bold text-[#3b1f18] shadow-lg md:hidden">
                Move the map to place the pin exactly.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}