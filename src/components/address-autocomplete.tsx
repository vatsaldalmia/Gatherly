import { useEffect, useRef } from "react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (description: string, placeId: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
};

function AutocompleteInner({ id, value, onChange, onSelect, placeholder, className, required }: Props) {
  const placesLib = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Attach native Autocomplete widget once the places library is ready
  useEffect(() => {
    if (!placesLib || !inputRef.current || acRef.current) return;

    const ac = new placesLib.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "place_id", "geometry", "name"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const placeId = place.place_id ?? "";

      // Use place.name as the display label (e.g. "Feb 30 Orchid") — recognisable to other participants.
      // Geocoding uses the placeId directly so accuracy isn't affected.
      const label = place.name || place.formatted_address || inputRef.current?.value || "";

      onChange(label);
      onSelect(label, placeId);
    });

    acRef.current = ac;

    return () => {
      if (acRef.current) {
        google.maps.event.clearInstanceListeners(acRef.current);
        acRef.current = null;
      }
    };
  }, [placesLib]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the DOM input value in sync when the parent resets it
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <Input
      ref={inputRef}
      id={id}
      defaultValue={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn("h-11", className)}
      required={required}
      autoComplete="off"
    />
  );
}

export function AddressAutocomplete(props: Props) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!apiKey) {
    return (
      <Input
        id={props.id}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className={cn("h-11", props.className)}
        required={props.required}
      />
    );
  }
  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
      <AutocompleteInner {...props} />
    </APIProvider>
  );
}
