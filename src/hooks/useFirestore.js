import { useState, useEffect } from "react";
import {
  subscribeToItems,
  subscribeToLocations,
  subscribeToCategories,
} from "../services/dbService";

export const useFirestore = () => {
  const [items,      setItems]      = useState([]);
  const [locations,  setLocations]  = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    let itemsDone = false, locsDone = false, catsDone = false;
    const checkDone = () => {
      if (itemsDone && locsDone && catsDone) setLoadingData(false);
    };

    const unsubItems = subscribeToItems((data) => {
      setItems(data); itemsDone = true; checkDone();
    });
    const unsubLocs = subscribeToLocations((data) => {
      setLocations(data); locsDone = true; checkDone();
    });
    const unsubCats = subscribeToCategories((data) => {
      setCategories(data); catsDone = true; checkDone();
    });

    return () => { unsubItems(); unsubLocs(); unsubCats(); };
  }, []);

  return { items, locations, categories, loadingData };
};
