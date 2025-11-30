import React, { useState } from "react";

interface EventForm {
  title: string;
  description: string;
  dateTime: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  visibility: "public" | "friends";
  images: string[];
  price?: number;
  tags: string[];
  createdBy: string;
}

interface EventResponse {
  _id: string;
  title: string;
  description: string;
  dateTime: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  visibility: "public" | "friends";
  images: string[];
  price?: number;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ErrorResponse {
  error: string;
}

const CreateEventForm: React.FC = () => {
  const [title, setTitle] = useState("");
  const [response, setResponse] = useState<EventResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: EventForm = {
      title,
      description: "Default description",
      dateTime: new Date().toISOString(),
      location: {
        address: "Default address",
        latitude: 0,
        longitude: 0,
      },
      visibility: "public",
      images: [],
      price: 0,
      tags: ["default"],
      createdBy: "me",
    };

    console.log("Sending payload:", payload);

    try {
      const res = await fetch("http://localhost:8000/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data: EventResponse | ErrorResponse | null = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        setError((data as ErrorResponse)?.error || `Server returned status ${res.status}`);
        setResponse(null);
      } else {
        setResponse(data as EventResponse);
        setError(null);
        setTitle("");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setResponse(null);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Event Name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <button type="submit">Create Event</button>
      </form>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
    </div>
  );
};

export default CreateEventForm;