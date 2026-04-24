import { useState, useEffect } from "react";
import {
  subscribeToItems,
  subscribeToLocations,
  subscribeToCategories,
} from "../services/dbService";

export const useFirestore = () => {
  const [items,       setItems]       = useState([]);
  const [locations,   setLocations]   = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    // Use a ref-style object so closure always sees latest values
    const done = { items: false, locations: false, categories: false };
    const checkDone = () => {
      if (done.items && done.locations && done.categories) {
        setLoadingData(false);
      }
    };

    const unsubItems = subscribeToItems((data) => {
      setItems(data);
      done.items = true;
      checkDone();
    });
    const unsubLocs = subscribeToLocations((data) => {
      setLocations(data);
      done.locations = true;
      checkDone();
    });
    const unsubCats = subscribeToCategories((data) => {
      setCategories(data);
      done.cats = true;
      // fix: was checking done.categories but setting done.cats
      done.categories = true;
      checkDone();
    });

    return () => { unsubItems(); unsubLocs(); unsubCats(); };
  }, []);

  return { items, locations, categories, loadingData };
};