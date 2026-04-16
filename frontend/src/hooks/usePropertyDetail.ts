import { useState, useEffect } from "react";
import { propertyService, type Property } from "@/services/property";
import { usePropertyStore } from "@/store/propertyStore";

export interface PropertyDetail {
  property: Property | null;
  loading: boolean;
}

export function usePropertyDetail(id: string | undefined): PropertyDetail {
  const { properties: storeProperties } = usePropertyStore();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    propertyService.getProperty(BigInt(id))
      .then((p)  => { if (!cancelled) setProperty(p); })
      .catch(()  => {
        const cached = storeProperties.find((p) => String(p.id) === id);
        if (!cancelled) setProperty(cached ?? null);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { property, loading };
}
