"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Plane, Route } from "lucide-react";
import {
  addTransportAction,
  type TripLogisticsActionState,
} from "@/features/trip-logistics/actions";
import type { PendingLocation } from "@/components/map/plan-map/types";
import PlaceSearchInput from "@/components/places/PlaceSearchInput";
import SubmitButton from "@/components/shared/SubmitButton";
import { Button } from "@/components/ui/button";
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

type Props = {
  tripId: string;
  apiKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}: Props) {
  const [state, formAction] = useActionState(addTransportAction, initialState);
  const [type, setType] = useState<"flight" | "custom">("flight");
  const [flightNumber, setFlightNumber] = useState("");
  const [flightSuggestions, setFlightSuggestions] = useState<FlightRouteSuggestion[]>([]);
  const [lookupError, setLookupError] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [departureQuery, setDepartureQuery] = useState("");
  const [departure, setDeparture] = useState<PendingLocation | null>(null);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destination, setDestination] = useState<PendingLocation | null>(null);

  const normalizedFlightNumber = flightNumber.replace(/\s+/g, "").toUpperCase();
  const selectedSuggestion =
    flightSuggestions.find((suggestion) => suggestion.id === selectedSuggestionId) ?? null;

  const flightDepartureLocation = useMemo(
    () =>
      selectedSuggestion
        ? {
            name: `${selectedSuggestion.departureAirport.name} · ${selectedSuggestion.departureAirport.iataCode}`,
            address: formatAirportAddress(selectedSuggestion.departureAirport),
            placeId: selectedSuggestion.departureAirport.iataCode,
            lat: selectedSuggestion.departureAirport.lat,
            lng: selectedSuggestion.departureAirport.lng,
          }
        : null,
    [selectedSuggestion],
  );

  const flightArrivalLocation = useMemo(
    () =>
      selectedSuggestion
        ? {
            name: `${selectedSuggestion.arrivalAirport.name} · ${selectedSuggestion.arrivalAirport.iataCode}`,
            address: formatAirportAddress(selectedSuggestion.arrivalAirport),
            placeId: selectedSuggestion.arrivalAirport.iataCode,
            lat: selectedSuggestion.arrivalAirport.lat,
            lng: selectedSuggestion.arrivalAirport.lng,
          }
        : null,
    [selectedSuggestion],
  );

  function resetForm() {
    setType("flight");
    setFlightNumber("");
    setFlightSuggestions([]);
    setLookupError("");
    setIsLookingUp(false);
    setSelectedSuggestionId("");
    setDepartureDate("");
    setArrivalDate("");
    setDepartureTime("");
    setArrivalTime("");
    setDepartureQuery("");
    setDeparture(null);
    setDestinationQuery("");
    setDestination(null);
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
  }

  const canSubmitFlight =
    !!selectedSuggestion &&
    !!departureDate &&
    !!arrivalDate &&
    !!departureTime &&
    !!arrivalTime;

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
          <DialogTitle>Add transport</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4 overflow-x-hidden overflow-y-auto pr-1">
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="type" value={type} />
          <input
            type="hidden"
            name="departureName"
            value={
              type === "flight"
                ? flightDepartureLocation?.name ?? ""
                : departure?.name ?? ""
            }
          />
          <input
            type="hidden"
            name="departureAddress"
            value={
              type === "flight"
                ? flightDepartureLocation?.address ?? ""
                : departure?.address ?? ""
            }
          />
          <input
            type="hidden"
            name="departureLat"
            value={
              type === "flight"
                ? flightDepartureLocation?.lat ?? ""
                : departure?.lat ?? ""
            }
          />
          <input
            type="hidden"
            name="departureLng"
            value={
              type === "flight"
                ? flightDepartureLocation?.lng ?? ""
                : departure?.lng ?? ""
            }
          />
          <input
            type="hidden"
            name="departurePlaceId"
            value={
              type === "flight"
                ? flightDepartureLocation?.placeId ?? ""
                : departure?.placeId ?? ""
            }
          />
          <input
            type="hidden"
            name="arrivalName"
            value={
              type === "flight"
                ? flightArrivalLocation?.name ?? ""
                : destination?.name ?? ""
            }
          />
          <input
            type="hidden"
            name="arrivalAddress"
            value={
              type === "flight"
                ? flightArrivalLocation?.address ?? ""
                : destination?.address ?? ""
            }
          />
          <input
            type="hidden"
            name="arrivalLat"
            value={
              type === "flight"
                ? flightArrivalLocation?.lat ?? ""
                : destination?.lat ?? ""
            }
          />
          <input
            type="hidden"
            name="arrivalLng"
            value={
              type === "flight"
                ? flightArrivalLocation?.lng ?? ""
                : destination?.lng ?? ""
            }
          />
          <input
            type="hidden"
            name="arrivalPlaceId"
            value={
              type === "flight"
                ? flightArrivalLocation?.placeId ?? ""
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
                  <Input
                    type="date"
                    name="departureDate"
                    value={departureDate}
                    onChange={(event) => setDepartureDate(event.target.value)}
                    className="rounded-xl h-11"
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
                  <Input
                    type="date"
                    name="arrivalDate"
                    value={arrivalDate}
                    onChange={(event) => setArrivalDate(event.target.value)}
                    className="rounded-xl h-11"
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
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Transport title</Label>
                <Input
                  name="title"
                  placeholder="e.g. Ferry to island"
                  className="rounded-xl h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Departure date</Label>
                  <Input
                    type="date"
                    name="departureDate"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Departure time</Label>
                  <Input
                    type="time"
                    name="departureTime"
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Arrival date</Label>
                  <Input
                    type="date"
                    name="arrivalDate"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Arrival time</Label>
                  <Input
                    type="time"
                    name="arrivalTime"
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
              pendingLabel="Adding..."
              disabled={type === "flight" ? !canSubmitFlight : undefined}
            >
              Add
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
