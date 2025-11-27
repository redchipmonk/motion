import { type FormEvent, useEffect, useState } from "react";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
} from "../lib/api";

type EventForm = {
  title: string;
  description: string;
  dateTime: string;
  visibility: "public" | "friends";
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
};

export default function EventTesterPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>({
    title: "",
    description: "",
    dateTime: "",
    visibility: "public",
    location: { address: "", latitude: 0, longitude: 0 },
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createEvent(form);
      await load();
      setForm({
        title: "",
        description: "",
        dateTime: "",
        visibility: "public",
        location: { address: "", latitude: 0, longitude: 0 },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleFetchOne() {
    if (!selectedId) return;
    setError(null);
    try {
      const event = await getEvent(selectedId);
      alert(JSON.stringify(event, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleUpdate() {
    if (!selectedId) return;
    setError(null);
    try {
      await updateEvent(selectedId, {
        title: `${form.title || "Updated"} (${Date.now()})`,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    setError(null);
    try {
      await deleteEvent(selectedId);
      setSelectedId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1>Event Routes Tester</h1>

      <form onSubmit={handleCreate} style={{ display: "grid", gap: "0.5rem", maxWidth: 400 }}>
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
        />
        <textarea
          required
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />
        <input
          required
          type="datetime-local"
          value={form.dateTime}
          onChange={(e) => setForm((prev) => ({ ...prev, dateTime: e.target.value }))}
        />
        <select
          value={form.visibility}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, visibility: e.target.value as EventForm["visibility"] }))
          }
        >
          <option value="public">Public</option>
          <option value="friends">Friends</option>
        </select>
        <input
          required
          placeholder="Location address"
          value={form.location.address}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, location: { ...prev.location, address: e.target.value } }))
          }
        />
        <input
          type="number"
          placeholder="Latitude"
          value={form.location.latitude}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              location: { ...prev.location, latitude: Number(e.target.value) },
            }))
          }
        />
        <input
          type="number"
          placeholder="Longitude"
          value={form.location.longitude}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              location: { ...prev.location, longitude: Number(e.target.value) },
            }))
          }
        />
        <button type="submit">Create Event</button>
      </form>

      <hr />

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={load} disabled={loading}>
          Refresh
        </button>
        <button onClick={handleFetchOne} disabled={!selectedId}>
          Fetch Selected
        </button>
        <button onClick={handleUpdate} disabled={!selectedId}>
          Update Selected
        </button>
        <button onClick={handleDelete} disabled={!selectedId}>
          Delete Selected
        </button>
      </div>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {events.map((event) => (
            <li
              key={event._id}
              onClick={() => setSelectedId(event._id)}
              style={{
                cursor: "pointer",
                padding: "0.5rem",
                marginBottom: "0.25rem",
                border: "1px solid #ddd",
                background: event._id === selectedId ? "#eef" : "white",
              }}
            >
              <strong>{event.title}</strong>
              <div>{new Date(event.dateTime).toLocaleString()}</div>
              <div>{event.visibility}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
