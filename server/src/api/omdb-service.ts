export default async function fetchFromOMDB(imdbId: string) {
  const url = `${process.env.OMDB_BASE_URL}/?i=${imdbId}&apikey=${process.env.OMDB_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  } catch (error: any) {
    console.error(
      `[OMDB Fetch Failure] ID: ${imdbId} | Message: ${error.message}`,
    );
    return null;
  }
}
