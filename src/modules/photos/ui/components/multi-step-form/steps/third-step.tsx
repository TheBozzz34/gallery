import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, X, MapPin } from "lucide-react";
import { Form, FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { thirdStepSchema, StepProps, ThirdStepData } from "../types";
import {
  type AddressData,
  getPrimaryAddressFeature,
  useGetAddress,
} from "@/modules/mapbox/hooks/use-get-address";
import { Skeleton } from "@/components/ui/skeleton";
import { formatGPSCoordinates } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ButtonGroup } from "@/components/ui/button-group";

const MapboxComponent = dynamic(
  () => import("@/modules/mapbox/ui/components/map"),
  {
    ssr: false,
    loading: () => (
      <div className="size-full flex items-center justify-center bg-muted">
        <Skeleton className="h-full w-full" />
      </div>
    ),
  }
);

interface SearchResult {
  properties: {
    name: string;
    place_formatted: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface ThirdStepProps extends StepProps {
  onAddressUpdate?: (addressData: AddressData | null) => void;
}

export function ThirdStep({
  onNext,
  onBack,
  initialData,
  isSubmitting,
  onAddressUpdate,
}: ThirdStepProps) {
  const initialLongitude = initialData?.longitude ?? 0;
  const initialLatitude = initialData?.latitude ?? 0;

  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  }>({
    lat: initialLatitude || 0,
    lng: initialLongitude || 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<ThirdStepData>({
    resolver: zodResolver(thirdStepSchema),
    defaultValues: {
      latitude: initialData?.latitude ?? 0,
      longitude: initialData?.longitude ?? 0,
      ...initialData,
    },
    mode: "onChange",
  });

  const { handleSubmit, formState } = form;
  const { isValid } = formState;

  const { data: addressData } = useGetAddress({
    lat: currentLocation.lat,
    lng: currentLocation.lng,
  });
  const primaryAddressFeature = getPrimaryAddressFeature(addressData);

  useEffect(() => {
    if (addressData && onAddressUpdate) {
      onAddressUpdate(addressData);
    }
  }, [addressData, onAddressUpdate]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
          searchQuery
        )}&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&limit=10`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, handleSearch]);

  const handleSelectLocation = (result: SearchResult) => {
    const [lng, lat] = result.geometry.coordinates;
    setCurrentLocation({ lat, lng });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const mapValues = useMemo(() => {
    const longitude = currentLocation.lng || initialLongitude;
    const latitude = currentLocation.lat || initialLatitude;

    return {
      markers:
        longitude === 0 && latitude === 0
          ? []
          : [
              {
                id: "location",
                longitude,
                latitude,
              },
            ],
      viewState: {
        longitude: longitude || -122.4,
        latitude: latitude || 37.8,
        zoom: longitude === 0 && latitude === 0 ? 2 : 10,
      },
    };
  }, [
    currentLocation.lat,
    currentLocation.lng,
    initialLatitude,
    initialLongitude,
  ]);

  const onSubmit = (data: ThirdStepData) => {
    onNext({
      ...data,
      latitude: currentLocation.lat || initialLatitude,
      longitude: currentLocation.lng || initialLongitude,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormItem>
          <FormLabel>Search for a place</FormLabel>
          <div className="relative mb-2">
            <ButtonGroup>
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                variant="outline"
                aria-label="Search"
                onClick={handleClearSearch}
                disabled={!searchQuery || isSearching}
              >
                <X />
              </Button>
            </ButtonGroup>

            {searchResults.length > 0 && (
              <Card className="absolute z-10 mt-1 w-full p-0 shadow-lg">
                <ScrollArea className="h-[200px]">
                  <div className="p-0">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        className="flex w-full items-start gap-2 border-b px-4 py-2 text-left transition-colors last:border-b-0 hover:bg-accent"
                        onClick={() => handleSelectLocation(result)}
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {result.properties.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {result.properties.place_formatted}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}
          </div>

          <FormControl>
            <div className="h-[400px] w-full overflow-hidden rounded-md border">
              <MapboxComponent
                draggableMarker
                markers={mapValues.markers}
                initialViewState={mapValues.viewState}
                onMarkerDragEnd={(markerId, lngLat) => {
                  setCurrentLocation({
                    lat: lngLat.lat,
                    lng: lngLat.lng,
                  });
                }}
              />
            </div>
          </FormControl>

          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="text-xs">
                {currentLocation.lat !== 0 && currentLocation.lng !== 0
                  ? formatGPSCoordinates(
                      currentLocation.lat,
                      currentLocation.lng
                    )
                  : "Drag the marker to set location"}
              </span>
            </div>
            {primaryAddressFeature && (
              <div className="text-xs">
                Location: {primaryAddressFeature.properties.place_formatted}
              </div>
            )}
          </div>
        </FormItem>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button type="submit" disabled={isSubmitting || !isValid}>
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
