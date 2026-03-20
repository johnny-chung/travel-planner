"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Loader2, Plane, Route } from "lucide-react";
import {
  addTransportAction,
  type TripLogisticsActionState,
  updateTransportAction,
} from "@/features/trip-logistics/actions";
import type { PendingLocation } from "@/features/planner/components/plan-map/types";
import PlaceSearchInput from "@/features/places/components/PlaceSearchInput";
import SubmitButton from "@/features/shared/components/SubmitButton";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FlightRouteSuggestion } from "@/types/trip-logistics";
import type { TripTransportItem } from "@/types/trip-logistics";

type Props = {
  tripId: string;
  apiKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTransport?: TripTransportItem | null;
};

const initialState: TripLogisticsActionState = {};

function formatAirportAddress(suggestion: FlightRouteSuggestion["departureAirport"]) {
  return [suggestion.name, suggestion.city, suggestion.countryCode]
    .filter(Boolean)
    .join(", ");
}

function isValidFlightNumber(value: string) {
  return /^[A-Z0-9]{2,3}\d{1,4}[A-Z]?$/.test(value.replace(/\s+/g, "").toUpperCase());
}

export default function AddTransportDialog({
  tripId,
  apiKey,
  open,
  onOpenChange,
  initialTransport = null,
}: Props) {
  const isEditing = Boolean(initialTransport);
  const [state, formAction] = useActionState(
    isEditing ? updateTransportAction : addTransportAction,
    initialState,
  );
  const [type, setType] = useState<"flight" | "custom">(initialTransport?.type ?? "flight");
  const [flightNumber, setFlightNumber] = useState(initialTransport?.flightNumber ?? "");
  const [flightSuggestions, setFlightSuggestions] = useState<FlightRouteSuggestion[]>([]);
  const [lookupError, setLookupError] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState("");
  const [customTitle, setCustomTitle] = useState(
    initialTransport?.type === "custom" ? initialTransport.title : "",
  );
  const [departureDate, setDepartureDate] = useState(initialTransport?.departureDate ?? "");
  const [arrivalDate, setArrivalDate] = useState(initialTransport?.arrivalDate ?? "");
  const [departureTime, setDepartureTime] = useState(initialTransport?.departureTime ?? "");
  const [arrivalTime, setArrivalTime] = useState(initialTransport?.arrivalTime ?? "");
  const [departureQuery, setDepartureQuery] = useState(initialTransport?.departure.name ?? "");
  const [departure, setDeparture] = useState<PendingLocation | null>(
    initialTransport
      ? {
          ...initialTransport.departure,
          lat: initialTransport.departure.lat ?? 0,
          lng: initialTransport.departure.lng ?? 0,
          openingHours: [],
          phone: "",
          website: "",
          thumbnail: "",
        }
      : null,
  );
  const [destinationQuery, setDestinationQuery] = useState(initialTransport?.arrival.name ?? "");
  const [destination, setDestination] = useState<PendingLocation | null>(
    initialTransport
      ? {
          ...initialTransport.arrival,
          lat: initialTransport.arrival.lat ?? 0,
          lng: initialTransport.arrival.lng ?? 0,
          openingHours: [],
          phone: "",
          website: "",
          thumbnail: "",
        }
      : null,
  );

  const normalizedFlightNumber = flightNumber.replace(/\s+/g, "").toUpperCase();
  function resetForm() {
    setType(initialTransport?.type ?? "flight");
    setFlightNumber(initialTransport?.flightNumber ?? "");
    setFlightSuggestions([]);
    setLookupError("");
    setIsLookingUp(false);
    setSelectedSuggestionId("");
    setCustomTitle(initialTransport?.type === "custom" ? initialTransport.title : "");
    setDepartureDate(initialTransport?.departureDate ?? "");
    setArrivalDate(initialTransport?.arrivalDate ?? "");
    setDepartureTime(initialTransport?.departureTime ?? "");
    setArrivalTime(initialTransport?.arrivalTime ?? "");
    setDepartureQuery(initialTransport?.departure.name ?? "");
    setDeparture(
      initialTransport
        ? {
            ...initialTransport.departure,
            lat: initialTransport.departure.lat ?? 0,
            lng: initialTransport.departure.lng ?? 0,
            openingHours: [],
            phone: "",
            website: "",
            thumbnail: "",
          }
        : null,
    );
    setDestinationQuery(initialTransport?.arrival.name ?? "");
    setDestination(
      initialTransport
        ? {
            ...initialTransport.arrival,
            lat: initialTransport.arrival.lat ?? 0,
            lng: initialTransport.arrival.lng ?? 0,
            openingHours: [],
            phone: "",
            website: "",
            thumbnail: "",
          }
        : null,
    );
  }

  useEffect(() => {
    if (!state.success) return;
    onOpenChange(false);
  }, [onOpenChange, state.success]);

  useEffect(() => {
    if (type !== "flight") {
      return;
    }
    if (!departureDate || arrivalDate) {
      return;
    }
    setArrivalDate(departureDate);
  }, [arrivalDate, departureDate, type]);

  useEffect(() => {
    if (type !== "flight") {
      return;
    }
    if (!normalizedFlightNumber) {
      setFlightSuggestions([]);
      setSelectedSuggestionId("");
      setLookupError("");
      setIsLookingUp(false);
      return;
    }
    if (!isValidFlightNumber(normalizedFlightNumber)) {
      setFlightSuggestions([]);
      setSelectedSuggestionId("");
      setLookupError("");
      setIsLookingUp(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLookingUp(true);
      setLookupError("");
      try {
        const response = await fetch(
          `/api/flights/lookup?flightNumber=${encodeURIComponent(normalizedFlightNumber)}`,
          {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
          },
        );
        const payload = (await response.json()) as {
          suggestions?: FlightRouteSuggestion[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Failed to look up this flight");
        }

        const suggestions = payload.suggestions ?? [];
        setFlightSuggestions(suggestions);
        setSelectedSuggestionId((current) =>
          suggestions.some((suggestion) => suggestion.id === current)
            ? current
            : "",
        );
        if (suggestions.length === 0) {
          setLookupError("No route suggestions found for this flight number.");
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setFlightSuggestions([]);
        setSelectedSuggestionId("");
        setLookupError(
          error instanceof Error ? error.message : "Failed to look up this flight",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLookingUp(false);
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [normalizedFlightNumber, type]);

  function selectSuggestion(suggestion: FlightRouteSuggestion) {
    setSelectedSuggestionId(suggestion.id);
    setDepartureTime(suggestion.departureTime);
    setArrivalTime(suggestion.arrivalTime);
    setDeparture({
      name: `${suggestion.departureAirport.name} · ${suggestion.departureAirport.iataCode}`,
      address: formatAirportAddress(suggestion.departureAirport),
      placeId: suggestion.departureAirport.iataCode,
      lat: suggestion.departureAirport.lat,
      lng: suggestion.departureAirport.lng,
      openingHours: [],
      phone: "",
      website: "",
      thumbnail: "",
    });
    setDepartureQuery(
      `${suggestion.departureAirport.name} · ${suggestion.departureAirport.iataCode}`,
    );
    setDestination({
      name: `${suggestion.arrivalAirport.name} · ${suggestion.arrivalAirport.iataCode}`,
      address: formatAirportAddress(suggestion.arrivalAirport),
      placeId: suggestion.arrivalAirport.iataCode,
      lat: suggestion.arrivalAirport.lat,
      lng: suggestion.arrivalAirport.lng,
      openingHours: [],
      phone: "",
      website: "",
      thumbnail: "",
    });
    setDestinationQuery(
      `${suggestion.arrivalAirport.name} · ${suggestion.arrivalAirport.iataCode}`,
    );
  }

  const canSubmitFlight =
    !!departureDate &&
    !!arrivalDate &&
    !!departureTime &&
    !!arrivalTime &&
    !!departure &&
    !!destination;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          resetForm();
        }
      }}
    >
        <DialogContent className="mx-auto flex max-h-[calc(100vh-2rem)] w-[min(100%-1rem,44rem)] max-w-[44rem] flex-col overflow-hidden rounded-2xl px-2 sm:w-[44rem] sm:max-w-[44rem] md:px-4">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit transport" : "Add transport"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4 overflow-x-hidden overflow-y-auto pr-1">
          <input type="hidden" name="tripId" value={tripId} />
          {isEditing ? (
            <input type="hidden" name="transportId" value={initialTransport?._id ?? ""} />
          ) : null}
          <input type="hidden" name="type" value={type} />
          <input
            type="hidden"
            name="departureName"
            value={
            type === "flight"
                ? departure?.name ?? ""
                : departure?.name ?? ""
            }
          />
          <input
            type="hidden"
            name="departureAddress"
            value={
            type === "flight"
                ? departure?.address ?? ""
                : departure?.address ?? ""
            }
          />
          <input
            type="hidden"
            name="departureLat"
            value={
            type === "flight"
                ? departure?.lat ?? ""
                : departure?.lat ?? ""
            }
          />
          <input
            type="hidden"
            name="departureLng"
            value={
            type === "flight"
                ? departure?.lng ?? ""
                : departure?.lng ?? ""
            }
          />
          <input
            type="hidden"
            name="departurePlaceId"
            value={
            type === "flight"
                ? departure?.placeId ?? ""
                : departure?.placeId ?? ""
            }
          />
          <input
            type="hidden"
            name="arrivalName"
            value={
            type === "flight"
                ? destination?.name ?? ""
                : destination?.name ?? ""
            }
          />
          <input
            type="hidden"
            name="arrivalAddress"
            value={
            type === "flight"
                ? destination?.address ?? ""
                : destination?.address ?? ""
            }
          />
          <input
            type="hidden"
            name="arrivalLat"
            value={
            type === "flight"
                ? destination?.lat ?? ""
                : destination?.lat ?? ""
            }
          />
          <input
            type="hidden"
            name="arrivalLng"
            value={
            type === "flight"
                ? destination?.lng ?? ""
                : destination?.lng ?? ""
            }
          />
          <input
            type="hidden"
            name="arrivalPlaceId"
            value={
            type === "flight"
                ? destination?.placeId ?? ""
                : destination?.placeId ?? ""
            }
          />

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as "flight" | "custom")}>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flight">
                  <span className="inline-flex items-center gap-2">
                    <Plane className="w-4 h-4" /> Flight
                  </span>
                </SelectItem>
                <SelectItem value="custom">
                  <span className="inline-flex items-center gap-2">
                    <Route className="w-4 h-4" /> Custom
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "flight" ? (
            <>
              <div className="space-y-1.5">
                <Label>Flight number</Label>
                <Input
                  name="flightNumber"
                  value={flightNumber}
                  onChange={(event) => {
                    setFlightNumber(event.target.value);
                    setSelectedSuggestionId("");
                  }}
                  placeholder="e.g. AC849"
                  className="rounded-xl h-11"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a valid flight number to fetch route suggestions from AirLabs.
                </p>
              </div>

              {isValidFlightNumber(normalizedFlightNumber) ? (
                <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      Route suggestions
                    </p>
                    {isLookingUp ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Searching
                      </span>
                    ) : null}
                  </div>
                  {flightSuggestions.length > 0 ? (
                    <div className="space-y-2">
                      {flightSuggestions.map((suggestion) => {
                        const isSelected = selectedSuggestionId === suggestion.id;
                        return (
                          <button
                            key={suggestion.id}
                            type="button"
                            onClick={() => selectSuggestion(suggestion)}
                            className={cn(
                              "w-full rounded-2xl border px-3 py-2 text-left transition-colors",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border bg-background hover:border-primary/40",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {suggestion.departureAirport.iataCode} {suggestion.departureTime} {"->"}{" "}
                                  {suggestion.arrivalAirport.iataCode} {suggestion.arrivalTime}
                                </p>
                              </div>
                              {isSelected ? (
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {lookupError ? (
                    <p className="text-sm text-muted-foreground">{lookupError}</p>
                  ) : null}
                </div>
              ) : flightNumber.trim() ? (
                <p className="text-sm text-muted-foreground">
                  Flight number format should look like <span className="font-medium">AC849</span>.
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Departure date</Label>
                  <DatePicker
                    name="departureDate"
                    value={departureDate}
                    onChange={setDepartureDate}
                    className="rounded-xl"
                    placeholder="Pick departure date"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Departure time</Label>
                  <Input
                    type="time"
                    name="departureTime"
                    value={departureTime}
                    onChange={(event) => setDepartureTime(event.target.value)}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Arrival date</Label>
                  <DatePicker
                    name="arrivalDate"
                    value={arrivalDate}
                    onChange={setArrivalDate}
                    className="rounded-xl"
                    placeholder="Pick arrival date"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Arrival time</Label>
                  <Input
                    type="time"
                    name="arrivalTime"
                    value={arrivalTime}
                    onChange={(event) => setArrivalTime(event.target.value)}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Departure airport</Label>
                <PlaceSearchInput
                  apiKey={apiKey}
                  value={departureQuery}
                  onChange={(value) => {
                    setDepartureQuery(value);
                    setDeparture(null);
                    setSelectedSuggestionId("");
                  }}
                  onSelect={(location) => {
                    setDepartureQuery(location.name);
                    setDeparture(location);
                  }}
                  placeholder="Search for the departure airport"
                  autoFocus={false}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Arrival airport</Label>
                <PlaceSearchInput
                  apiKey={apiKey}
                  value={destinationQuery}
                  onChange={(value) => {
                    setDestinationQuery(value);
                    setDestination(null);
                    setSelectedSuggestionId("");
                  }}
                  onSelect={(location) => {
                    setDestinationQuery(location.name);
                    setDestination(location);
                  }}
                  placeholder="Search for the arrival airport"
                  autoFocus={false}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Transport title</Label>
                <Input
                  name="title"
                  value={customTitle}
                  onChange={(event) => setCustomTitle(event.target.value)}
                  placeholder="e.g. Ferry to island"
                  className="rounded-xl h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Departure date</Label>
                  <DatePicker
                    name="departureDate"
                    value={departureDate}
                    onChange={setDepartureDate}
                    className="rounded-xl"
                    placeholder="Pick departure date"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Departure time</Label>
                  <Input
                    type="time"
                    name="departureTime"
                    value={departureTime}
                    onChange={(event) => setDepartureTime(event.target.value)}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Arrival date</Label>
                  <DatePicker
                    name="arrivalDate"
                    value={arrivalDate}
                    onChange={setArrivalDate}
                    className="rounded-xl"
                    placeholder="Pick arrival date"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Arrival time</Label>
                  <Input
                    type="time"
                    name="arrivalTime"
                    value={arrivalTime}
                    onChange={(event) => setArrivalTime(event.target.value)}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Departure location</Label>
                <PlaceSearchInput
                  apiKey={apiKey}
                  value={departureQuery}
                  onChange={(value) => {
                    setDepartureQuery(value);
                    setDeparture(null);
                  }}
                  onSelect={(location) => {
                    setDepartureQuery(location.name);
                    setDeparture(location);
                  }}
                  placeholder="Search for the departure location"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Destination</Label>
                <PlaceSearchInput
                  apiKey={apiKey}
                  value={destinationQuery}
                  onChange={(value) => {
                    setDestinationQuery(value);
                    setDestination(null);
                  }}
                  onSelect={(location) => {
                    setDestinationQuery(location.name);
                    setDestination(location);
                  }}
                  placeholder="Search for the destination"
                  autoFocus={false}
                />
              </div>
            </>
          )}

          {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}

          <DialogFooter className="gap-2 flex-row mt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <SubmitButton
              className="flex-1 rounded-xl"
              pendingLabel={isEditing ? "Saving..." : "Adding..."}
              disabled={type === "flight" ? !canSubmitFlight : undefined}
            >
              {isEditing ? "Save" : "Add"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
