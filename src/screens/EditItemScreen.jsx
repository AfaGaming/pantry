import { useState, useRef } from "react";
import { updateItem, upsertCategory } from "../services/dbService";
import { uploadItemImage } from "../services/storageService";
import { Label } from "../components/SharedComponents";
import { styles } from "../components/styles";
import { Timestamp } from "firebase/firestore";

const tsToDateString = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().split("T")[0];
};

export default function EditItemScreen({ item, locations, categories, onBack }) {
  const [name,        setName]        = useState(item.name || "");
  const [description, setDesc]        = useState(item.description || "");
  const [locationId,  setLocationId]  = useState(item.locationId || locations[0]?.id || "");
  const [catInput,    setCatInput]    = useState(item.category || "");
  const [quantity,    setQuantity]    = useState(item.quantity || "");
  const [expiryDate,  setExpiryDate]  = useState(tsToDateString(item.expiryDate));
  const [imgFile,     setImgFile]     = useState(null);
  const [imgPreview,  setImgPreview]  = useState(item.imageUrl || null);
  const [showCatDrop, setShowCatDrop] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const fileRef = useRef();

  const filteredCats = categories
    .filter((c) => c.name.toLowerCase().includes(catInput.toLowerCase()))
    .slice(0, 8);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImgPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Please enter an item name."); return; }
    if (!locationId)  { setError("Please select a location."); return; }
    setSaving(true);
    setError("");
    try {
      let imageUrl = item.imageUrl;

      // Only upload if user picked a new image
      if (imgFile) {
        imageUrl = await uploadItemImage(imgFile, item.id);
      }

      const category = catInput.trim();

      await updateItem(item.id, {
        name:        name.trim(),
        description: description.trim(),
        locationId,
        category,
        quantity:    quantity.trim(),
        expiryDate:  expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null,
        imageUrl,
      });

      if (category) await upsertCategory(category);

      onBack();
    } catch (e) {
      console.error(e);
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div style={styles.screen}>
      <div style={styles.detailHeader}>
        <button style={styles.backBtn} onClick={onBack} disabled={saving}>← Back</button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Edit Item</span>
        <button
          style={{ ...styles.backBtn, color: "#007aff", fontWeight: 700 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div style={styles.addForm}>
        {/* Photo */}
        <div style={styles.imgUploadBox} onClick={() => fileRef.current.click()}>
          {imgPreview
            ? <img src={imgPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
            : <div style={{ textAlign: "center", color: "#666" }}>
                <div style={{ fontSize: 36 }}>📷</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Tap to change photo</div>
              </div>}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleImage} />
        </div>

        <Label>Name *</Label>
        <input style={styles.input} placeholder="e.g. Leftover Pizza" value={name} onChange={(e) => setName(e.target.value)} />

        <Label>Description</Label>
        <input style={styles.input} placeholder="Optional details" value={description} onChange={(e) => setDesc(e.target.value)} />

        <Label>Location *</Label>
        <select style={styles.input} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
          <option value="">Select a location…</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>

        <Label>Category</Label>
        <div style={{ position: "relative" }}>
          <input
            style={styles.input}
            placeholder="Type or pick a category"
            value={catInput}
            onChange={(e) => { setCatInput(e.target.value); setShowCatDrop(true); }}
            onFocus={() => setShowCatDrop(true)}
            onBlur={() => setTimeout(() => setShowCatDrop(false), 150)}
          />
          {showCatDrop && filteredCats.length > 0 && (
            <div style={styles.dropdown}>
              {filteredCats.map((c) => (
                <div
                  key={c.id}
                  style={styles.dropItem}
                  onMouseDown={() => { setCatInput(c.name); setShowCatDrop(false); }}
                >
                  {c.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <Label>Quantity</Label>
        <input style={styles.input} placeholder="e.g. 3 slices, Half bar" value={quantity} onChange={(e) => setQuantity(e.target.value)} />

        <Label>Expiry Date</Label>
        <input style={styles.input} type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />

        {error && <p style={{ color: "#ff3b30", fontSize: 13, marginTop: 8 }}>{error}</p>}

        <button
          style={{ ...styles.btnPrimary, width: "100%", marginTop: 20, padding: "14px 0", fontSize: 16 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
