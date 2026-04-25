import { useState, useEffect } from "react";
import {
  subscribeToItems,
  subscribeToLocations,
  subscribeToCategories,
} from "../services/dbService";

export const useFirestore = (isApproved) => {
  const [items,       setItems]       = useState([]);
  const [locations,   setLocations]   = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isApproved) return;

    const done = { items: false, locations: false, categories: false };
    const checkDone = () => {
      if (done.items && done.locations && done.categories) setLoadingData(false);
    };

    const unsubItems = subscribeToItems((data) => {
      setItems(data); done.items = true; checkDone();
    });
    const unsubLocs = subscribeToLocations((data) => {
      setLocations(data); done.locations = true; checkDone();
    });
    const unsubCats = subscribeToCategories((data) => {
      setCategories(data); done.categories = true; checkDone();
    });

    return () => { unsubItems(); unsubLocs(); unsubCats(); };
  }, [isApproved]);

  return { items, locations, categories, loadingData };
};