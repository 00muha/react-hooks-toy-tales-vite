import React, { useEffect, useState } from "react";

import Header from "./Header";
import ToyForm from "./ToyForm";
import ToyContainer from "./ToyContainer";

const TOYS_URL = "http://localhost:3001/toys";

function App() {
  const [showForm, setShowForm] = useState(false);
  const [toys, setToys] = useState([]);
  const [error, setError] = useState("");

  // Load the server-backed toy collection once when the app mounts.
  useEffect(() => {
    fetch(TOYS_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load toys.");
        return response.json();
      })
      .then((loadedToys) =>
        setToys((currentToys) => {
          const currentById = new Map(
            currentToys.map((toy) => [toy.id, toy]),
          );
          const loadedIds = new Set(loadedToys.map((toy) => toy.id));

          return [
            ...loadedToys.map((toy) => ({ ...toy, ...currentById.get(toy.id) })),
            ...currentToys.filter((toy) => !loadedIds.has(toy.id)),
          ];
        }),
      )
      .catch(() => setError("Unable to load toys. Please try again."));
  }, []);

  function handleClick() {
    setShowForm((showForm) => !showForm);
  }

  // Keep the server-assigned ID and append the created toy to the collection.
  async function handleCreateToy(toy) {
    const newToy = { ...toy, likes: 0 };

    try {
      const response = await fetch(TOYS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newToy),
      });
      if (!response.ok) throw new Error("Unable to create toy.");

      const createdToy = await response.json();
      setToys((currentToys) => [
        ...currentToys,
        { ...newToy, ...createdToy, likes: createdToy.likes ?? 0 },
      ]);
      setError("");
      return true;
    } catch {
      setError("Unable to create toy. Please try again.");
      return false;
    }
  }

  // Replace only the matching item so a like never changes the list order.
  async function handleLikeToy(toy) {
    const likes = toy.likes + 1;

    try {
      const response = await fetch(`${TOYS_URL}/${toy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ likes }),
      });
      if (!response.ok) throw new Error("Unable to like toy.");

      const updatedToy = await response.json();
      setToys((currentToys) =>
        currentToys.map((currentToy) =>
          currentToy.id === toy.id
            ? { ...currentToy, ...updatedToy, likes: updatedToy.likes ?? likes }
            : currentToy,
        ),
      );
      setError("");
    } catch {
      setError("Unable to update likes. Please try again.");
    }
  }

  // Remove a toy locally only after the backend confirms deletion.
  async function handleDonateToy(toy) {
    try {
      const response = await fetch(`${TOYS_URL}/${toy.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Unable to delete toy.");

      setToys((currentToys) =>
        currentToys.filter((currentToy) => currentToy.id !== toy.id),
      );
      setError("");
    } catch {
      setError("Unable to donate toy. Please try again.");
    }
  }

  return (
    <>
      <Header />
      {showForm ? <ToyForm onCreateToy={handleCreateToy} /> : null}
      <div className="buttonContainer">
        <button onClick={handleClick}>Add a Toy</button>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <ToyContainer
        toys={toys}
        onLikeToy={handleLikeToy}
        onDonateToy={handleDonateToy}
      />
    </>
  );
}

export default App;
