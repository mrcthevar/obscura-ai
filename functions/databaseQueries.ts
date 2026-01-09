export interface DbItem {
  category: string;
  name: string;
  details: string;
}

// Mock Database for OBSCURA.AI
// Categories: movies (Masterclass), products (Gear), events (Industry), restaurants (Locations/Catering)
const MOCK_DB: Record<string, DbItem[]> = {
  movies: [
    { category: "movies", name: "Blade Runner 2049", details: "Dir: Denis Villeneuve, DOP: Roger Deakins. Tech: Alexa 65, Master Primes. Style: Neon-noir, atmospheric, brutalist, orange/teal separation." },
    { category: "movies", name: "The Godfather", details: "Dir: Francis Ford Coppola, DOP: Gordon Willis. Tech: Arriflex 35 IIC, Baltar Lenses. Style: Top-down lighting, darkness ('Prince of Darkness'), warm practicals." },
    { category: "movies", name: "In the Mood for Love", details: "Dir: Wong Kar-wai, DOP: Christopher Doyle. Tech: Arriflex 535. Style: Lush colors, step-printing, tight framing, red/green palette." },
    { category: "movies", name: "Dune: Part Two", details: "Dir: Denis Villeneuve, DOP: Greig Fraser. Tech: Alexa 65, Moviecam. Style: Monochromatic, vast scale, texture, brutalist architecture." },
    { category: "movies", name: "Oppenheimer", details: "Dir: Christopher Nolan, DOP: Hoyte van Hoytema. Tech: IMAX MKIV, Panavision 65. Style: Large format, shallow depth of field, black & white sequences." }
  ],
  products: [
    { category: "products", name: "Arri Alexa 35", details: "Sensor: Super 35 Alev 4. Dynamic Range: 17 stops. Native ISO: 800. Features: REVEAL Color Science, Textures. Status: Industry Standard." },
    { category: "products", name: "Cooke S4/i", details: "Lens Set: Prime. Character: 'The Cooke Look' - warm, smooth, skin-tone friendly. Flaring: Pleasant, organic. Usage: Portraiture, Narrative." },
    { category: "products", name: "Aputure 1200d Pro", details: "Light: LED Point Source. Output: 1200W HMI equivalent. Mount: Bowens. Features: Sidus Link App Control, Weather Resistant." },
    { category: "products", name: "Sony Venice 2", details: "Sensor: Full Frame 8.6K. Dual Base ISO: 800/3200. Features: Rialto Extension System, X-OCN recording." },
    { category: "products", name: "Astera Titan Tube", details: "Light: RGBWW LED Tube. Features: Wireless DMX, Battery powered, High CRI/TLCI. Usage: Practical lighting, music videos." }
  ],
  events: [
    { category: "events", name: "Camerimage 2025", details: "Date: Nov 15-22, 2025. Location: Toruń, Poland. Description: The premier international film festival of the art of cinematography." },
    { category: "events", name: "NAB Show 2025", details: "Date: April 5-9, 2025. Location: Las Vegas, NV. Description: The ultimate event for the media, entertainment, and technology industry." },
    { category: "events", name: "Cine Gear Expo LA", details: "Date: June 2025. Location: Warner Bros Studios, LA. Description: Equipment exhibition and seminars." }
  ],
  restaurants: [
    { category: "restaurants", name: "Studio Cafe", details: "Location: Lot 4. Cuisine: Organic/Vegan. Rating: 4.8 stars. Notes: Popular for production meetings." },
    { category: "restaurants", name: "The Commissary", details: "Location: Executive Building. Cuisine: Fine Dining. Rating: 5 stars. Notes: Requires reservation." }
  ]
};

export async function searchDatabase(category: string, query: string): Promise<string> {
  // Simulate network latency for realism
  await new Promise(resolve => setTimeout(resolve, 1500));

  const cat = category.toLowerCase();
  const db = MOCK_DB[cat];
  
  if (!db) {
    return `Error: Category '${category}' not found. Available: movies, products, events, restaurants.`;
  }
  
  if (!query || query.trim() === '') {
     return JSON.stringify(db.slice(0, 3)); // Return top 3 if no specific query
  }

  const results = db.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) || 
    item.details.toLowerCase().includes(query.toLowerCase())
  );

  if (results.length === 0) {
    return `No records found in '${category}' matching "${query}".`;
  }

  return JSON.stringify(results);
}