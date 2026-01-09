import { FunctionDeclaration, Type } from "@google/genai";

export const databaseToolDeclaration: FunctionDeclaration = {
  name: "query_database",
  description: "Query the OBSCURA production database. Use this to retrieve real-time data about specific movies (for Masterclass), technical gear specs (products), industry events, or studio locations/restaurants.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: "The category to search. Must be one of: 'movies' (films/directors), 'products' (cameras/lenses/lights), 'events' (festivals/expos), 'restaurants' (studio catering/locations).",
        enum: ["movies", "products", "events", "restaurants"]
      },
      searchTerm: {
        type: Type.STRING,
        description: "Specific keywords to search for (e.g., 'Deakins', 'Alexa', 'Camerimage'). Leave empty to list top items."
      }
    },
    required: ["category", "searchTerm"]
  }
};