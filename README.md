# Resonance — Music Library (React frontend)

A modern, purple-glow React UI for the `music-library-spring` Spring Boot backend.

## Setup

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` and by default calls the backend API at
`http://localhost:8080/api`. Start the Spring Boot backend first (`mvn spring-boot:run`),
making sure MySQL is configured per `application.properties`.

If your backend runs on a different host/port, use the URL field at the bottom of the
sidebar and click **Reconnect**.

## Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  api.js                 fetch wrapper + base URL config
  App.jsx                view routing / shell
  styles.css              global purple-glow theme
  components/
    Sidebar.jsx           nav + connection panel
    Toast.jsx             toast notification provider
    Shared.jsx             SongTable / ConsoleBlock / EmptyState
    Library.jsx            song CRUD + list
    SearchSort.jsx         linear/hash/BST search, artist/genre lookup, 5 sort algorithms
    Queue.jsx               song request queue
    Structures.jsx          linked list / stack / hash table / set viewers
    Trees.jsx                BST + AVL search, delete, traversals
    Graph.jsx                genre graph build/display/BFS/DFS
```
