// ~80 mock furniture items for demo use.
// Images: Unsplash (free, no attribution required for display).
// Prices are fake. Retailers are placeholder names. Product URLs are non-functional examples.

const R = ["Demo Store", "Fauxfurn Co.", "Placeholder Living"];
const u = (id, w = 400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
const p = (id) => `https://example-store.com/product/${id}`;

export const FURNITURE_FIXTURES = [
  // ── Sofas & Sectionals ──────────────────────────────────────────────────────
  { id: "fix-001", name: "Cloud Grey 3-Seater Sofa",         tags: ["sofa","couch","grey","modern"],      image_url: u("1555041469-a586c61ea9bc"),      price: 899,  retailer_name: R[0], product_url: p(1001), sponsored: false },
  { id: "fix-002", name: "Velvet Navy Loveseat",             tags: ["sofa","loveseat","velvet","navy"],    image_url: u("1493663284031-b7e3aefcae8e"),   price: 749,  retailer_name: R[1], product_url: p(1002), sponsored: false },
  { id: "fix-003", name: "Linen Sectional Sofa",             tags: ["sectional","sofa","linen","large"],  image_url: u("1555041469-a586c61ea9bc",600),   price: 1499, retailer_name: R[2], product_url: p(1003), sponsored: false },
  { id: "fix-004", name: "Mid-Century Teal Sofa",            tags: ["sofa","mid-century","teal","retro"], image_url: u("1493663284031-b7e3aefcae8e",500),price: 1099, retailer_name: R[0], product_url: p(1004), sponsored: true  },
  { id: "fix-005", name: "Compact Studio Sofa",              tags: ["sofa","compact","small","studio"],   image_url: u("1555041469-a586c61ea9bc",300),   price: 599,  retailer_name: R[1], product_url: p(1005), sponsored: false },
  { id: "fix-006", name: "Chesterfield Sofa",                tags: ["sofa","chesterfield","classic","button"], image_url: u("1493663284031-b7e3aefcae8e",350), price: 1299, retailer_name: R[2], product_url: p(1006), sponsored: false },
  { id: "fix-007", name: "Convertible Sleeper Sofa",         tags: ["sofa","sleeper","convertible","bed"],image_url: u("1555041469-a586c61ea9bc",450),   price: 849,  retailer_name: R[0], product_url: p(1007), sponsored: false },
  { id: "fix-008", name: "L-Shape Corner Sectional",         tags: ["sectional","corner","L-shape","sofa"],image_url: u("1493663284031-b7e3aefcae8e",650),price: 1699, retailer_name: R[1], product_url: p(1008), sponsored: false },

  // ── Armchairs & Accent Chairs ───────────────────────────────────────────────
  { id: "fix-009", name: "Terracotta Accent Chair",          tags: ["chair","armchair","terracotta","accent"],  image_url: u("1567538096630-e0c55bd6374c"),      price: 449,  retailer_name: R[2], product_url: p(1009), sponsored: false },
  { id: "fix-010", name: "Barrel Swivel Armchair",           tags: ["chair","swivel","barrel","modern"],        image_url: u("1550254478-ead40cc54513"),          price: 389,  retailer_name: R[0], product_url: p(1010), sponsored: false },
  { id: "fix-011", name: "Wingback Reading Chair",           tags: ["chair","wingback","reading","classic"],    image_url: u("1567538096630-e0c55bd6374c",350),   price: 629,  retailer_name: R[1], product_url: p(1011), sponsored: false },
  { id: "fix-012", name: "Egg Pod Chair",                    tags: ["chair","egg","pod","lounge","modern"],     image_url: u("1550254478-ead40cc54513",350),      price: 799,  retailer_name: R[2], product_url: p(1012), sponsored: true  },
  { id: "fix-013", name: "Velvet Boudoir Chair",             tags: ["chair","velvet","boudoir","glam"],         image_url: u("1567538096630-e0c55bd6374c",500),   price: 519,  retailer_name: R[0], product_url: p(1013), sponsored: false },
  { id: "fix-014", name: "Scandi Accent Chair",              tags: ["chair","scandinavian","minimal","wood"],   image_url: u("1550254478-ead40cc54513",500),      price: 329,  retailer_name: R[1], product_url: p(1014), sponsored: false },
  { id: "fix-015", name: "Rattan Lounge Chair",              tags: ["chair","rattan","wicker","bohemian","lounge"], image_url: u("1567538096630-e0c55bd6374c",600), price: 279,  retailer_name: R[2], product_url: p(1015), sponsored: false },
  { id: "fix-016", name: "Leather Club Chair",               tags: ["chair","leather","club","brown","vintage"], image_url: u("1550254478-ead40cc54513",600),     price: 899,  retailer_name: R[0], product_url: p(1016), sponsored: false },

  // ── Dining Chairs ───────────────────────────────────────────────────────────
  { id: "fix-017", name: "Tulip Plastic Dining Chair",       tags: ["chair","dining","tulip","plastic","modern"],image_url: u("1506439773649-6e0eb8cfb237"),      price: 89,   retailer_name: R[1], product_url: p(1017), sponsored: false },
  { id: "fix-018", name: "Windsor Wooden Dining Chair",      tags: ["chair","dining","wooden","windsor"],       image_url: u("1506439773649-6e0eb8cfb237",350),   price: 129,  retailer_name: R[2], product_url: p(1018), sponsored: false },
  { id: "fix-019", name: "Ghost Acrylic Chair",              tags: ["chair","dining","acrylic","ghost","clear"],image_url: u("1506439773649-6e0eb8cfb237",500),   price: 179,  retailer_name: R[0], product_url: p(1019), sponsored: false },
  { id: "fix-020", name: "Eames Style Plywood Chair",        tags: ["chair","dining","plywood","eames","organic"],image_url: u("1506439773649-6e0eb8cfb237",600), price: 219,  retailer_name: R[1], product_url: p(1020), sponsored: false },
  { id: "fix-021", name: "Velvet Tufted Dining Chair",       tags: ["chair","dining","velvet","tufted","upholstered"], image_url: u("1550254478-ead40cc54513",400), price: 159, retailer_name: R[2], product_url: p(1021), sponsored: false },
  { id: "fix-022", name: "Metal Hairpin Leg Chair",          tags: ["chair","dining","metal","hairpin","industrial"], image_url: u("1506439773649-6e0eb8cfb237",450), price: 99, retailer_name: R[0], product_url: p(1022), sponsored: false },

  // ── Coffee Tables ───────────────────────────────────────────────────────────
  { id: "fix-023", name: "Marble Top Coffee Table",          tags: ["table","coffee","marble","white","modern"], image_url: u("1532372320572-cda25653a26d"),       price: 549,  retailer_name: R[1], product_url: p(1023), sponsored: false },
  { id: "fix-024", name: "Walnut Coffee Table",              tags: ["table","coffee","walnut","wood","warm"],    image_url: u("1532372320572-cda25653a26d",350),   price: 399,  retailer_name: R[2], product_url: p(1024), sponsored: false },
  { id: "fix-025", name: "Round Rattan Coffee Table",        tags: ["table","coffee","rattan","round","bohemian"],image_url: u("1532372320572-cda25653a26d",500),  price: 279,  retailer_name: R[0], product_url: p(1025), sponsored: false },
  { id: "fix-026", name: "Nesting Coffee Tables (set of 2)", tags: ["table","coffee","nesting","set","flexible"],image_url: u("1532372320572-cda25653a26d",600),   price: 349,  retailer_name: R[1], product_url: p(1026), sponsored: false },
  { id: "fix-027", name: "Glass Top Coffee Table",           tags: ["table","coffee","glass","metal","contemporary"],image_url: u("1532372320572-cda25653a26d",450),price: 469, retailer_name: R[2], product_url: p(1027), sponsored: true  },
  { id: "fix-028", name: "Lift-Top Storage Coffee Table",    tags: ["table","coffee","storage","lift","multifunctional"],image_url: u("1532372320572-cda25653a26d",650),price: 599, retailer_name: R[0], product_url: p(1028), sponsored: false },
  { id: "fix-029", name: "Ottoman Coffee Table (Velvet)",    tags: ["ottoman","coffee","velvet","multipurpose"], image_url: u("1532372320572-cda25653a26d",550),   price: 239,  retailer_name: R[1], product_url: p(1029), sponsored: false },

  // ── Dining Tables ───────────────────────────────────────────────────────────
  { id: "fix-030", name: "Extendable Dining Table",          tags: ["table","dining","extendable","wood"],      image_url: u("1484101403633-562f891dc89a"),       price: 799,  retailer_name: R[2], product_url: p(1030), sponsored: false },
  { id: "fix-031", name: "Round Marble Dining Table",        tags: ["table","dining","marble","round","white"], image_url: u("1484101403633-562f891dc89a",350),   price: 1199, retailer_name: R[0], product_url: p(1031), sponsored: false },
  { id: "fix-032", name: "Farmhouse Dining Table",           tags: ["table","dining","farmhouse","rustic","wood"],image_url: u("1484101403633-562f891dc89a",500),  price: 699,  retailer_name: R[1], product_url: p(1032), sponsored: false },
  { id: "fix-033", name: "Glass Pedestal Dining Table",      tags: ["table","dining","glass","pedestal","modern"],image_url: u("1484101403633-562f891dc89a",600),  price: 949,  retailer_name: R[2], product_url: p(1033), sponsored: false },
  { id: "fix-034", name: "Industrial Metal Dining Table",    tags: ["table","dining","industrial","metal","black"],image_url: u("1484101403633-562f891dc89a",450), price: 549,  retailer_name: R[0], product_url: p(1034), sponsored: false },

  // ── Beds & Bed Frames ───────────────────────────────────────────────────────
  { id: "fix-035", name: "Platform Upholstered Bed",         tags: ["bed","platform","upholstered","frame","grey"],image_url: u("1524758631624-e2822e304c36"),     price: 849,  retailer_name: R[1], product_url: p(1035), sponsored: false },
  { id: "fix-036", name: "Canopy Bed Frame (King)",          tags: ["bed","canopy","king","wood","four-poster"],  image_url: u("1505693416388-ac5ce068fe85"),     price: 1299, retailer_name: R[2], product_url: p(1036), sponsored: false },
  { id: "fix-037", name: "Rattan Headboard Bed",             tags: ["bed","rattan","headboard","bohemian"],       image_url: u("1524758631624-e2822e304c36",350), price: 699,  retailer_name: R[0], product_url: p(1037), sponsored: false },
  { id: "fix-038", name: "Floating Platform Bed",            tags: ["bed","platform","floating","minimalist"],    image_url: u("1505693416388-ac5ce068fe85",350), price: 979,  retailer_name: R[1], product_url: p(1038), sponsored: true  },
  { id: "fix-039", name: "Metal Bed Frame (Queen)",          tags: ["bed","metal","queen","black","simple"],      image_url: u("1524758631624-e2822e304c36",500), price: 399,  retailer_name: R[2], product_url: p(1039), sponsored: false },
  { id: "fix-040", name: "Storage Bed with Drawers",         tags: ["bed","storage","drawers","practical"],       image_url: u("1505693416388-ac5ce068fe85",500), price: 1199, retailer_name: R[0], product_url: p(1040), sponsored: false },

  // ── Desks & Work Areas ──────────────────────────────────────────────────────
  { id: "fix-041", name: "Standing Desk (Electric)",         tags: ["desk","standing","electric","adjustable","office"],image_url: u("1518455027359-f3f8164ba6bd"),  price: 799, retailer_name: R[1], product_url: p(1041), sponsored: false },
  { id: "fix-042", name: "Floating Wall Desk",               tags: ["desk","wall","floating","compact","minimal"], image_url: u("1518455027359-f3f8164ba6bd",350),  price: 249, retailer_name: R[2], product_url: p(1042), sponsored: false },
  { id: "fix-043", name: "Solid Oak Writing Desk",           tags: ["desk","oak","wood","writing","classic"],     image_url: u("1518455027359-f3f8164ba6bd",500),  price: 599, retailer_name: R[0], product_url: p(1043), sponsored: false },
  { id: "fix-044", name: "L-Shape Corner Desk",              tags: ["desk","corner","L-shape","large","office"],  image_url: u("1518455027359-f3f8164ba6bd",600),  price: 449, retailer_name: R[1], product_url: p(1044), sponsored: false },
  { id: "fix-045", name: "Vintage Secretary Desk",           tags: ["desk","secretary","vintage","fold","retro"], image_url: u("1518455027359-f3f8164ba6bd",450),  price: 379, retailer_name: R[2], product_url: p(1045), sponsored: false },

  // ── Shelves & Storage ───────────────────────────────────────────────────────
  { id: "fix-046", name: "Open Bookcase (5-shelf)",          tags: ["shelf","bookcase","open","books","tall"],    image_url: u("1565183928294-7063f23ce0f8"),       price: 299,  retailer_name: R[0], product_url: p(1046), sponsored: false },
  { id: "fix-047", name: "Floating Wall Shelves (set of 3)", tags: ["shelf","floating","wall","set","minimal"],   image_url: u("1565183928294-7063f23ce0f8",350),   price: 129,  retailer_name: R[1], product_url: p(1047), sponsored: false },
  { id: "fix-048", name: "Ladder Shelf",                     tags: ["shelf","ladder","leaning","modern","open"],  image_url: u("1565183928294-7063f23ce0f8",500),   price: 199,  retailer_name: R[2], product_url: p(1048), sponsored: false },
  { id: "fix-049", name: "Modular Cube Shelving Unit",       tags: ["shelf","cube","modular","storage","box"],    image_url: u("1565183928294-7063f23ce0f8",600),   price: 349,  retailer_name: R[0], product_url: p(1049), sponsored: true  },
  { id: "fix-050", name: "Media Console & Shelving",         tags: ["shelf","media","console","tv","storage"],    image_url: u("1565183928294-7063f23ce0f8",450),   price: 499,  retailer_name: R[1], product_url: p(1050), sponsored: false },
  { id: "fix-051", name: "Industrial Pipe Shelving",         tags: ["shelf","industrial","pipe","metal","wood"],  image_url: u("1565183928294-7063f23ce0f8",550),   price: 259,  retailer_name: R[2], product_url: p(1051), sponsored: false },
  { id: "fix-052", name: "Corner Floating Shelf",            tags: ["shelf","corner","floating","compact"],       image_url: u("1565183928294-7063f23ce0f8",650),   price: 79,   retailer_name: R[0], product_url: p(1052), sponsored: false },

  // ── Lamps ───────────────────────────────────────────────────────────────────
  { id: "fix-053", name: "Arc Floor Lamp",                   tags: ["lamp","floor","arc","modern","light"],       image_url: u("1507473885765-e6ed057f782c"),       price: 189,  retailer_name: R[1], product_url: p(1053), sponsored: false },
  { id: "fix-054", name: "Tripod Floor Lamp",                tags: ["lamp","floor","tripod","wooden","nordic"],   image_url: u("1507473885765-e6ed057f782c",350),   price: 149,  retailer_name: R[2], product_url: p(1054), sponsored: false },
  { id: "fix-055", name: "Table Lamp (Marble Base)",         tags: ["lamp","table","marble","ceramic","light"],   image_url: u("1507473885765-e6ed057f782c",500),   price: 119,  retailer_name: R[0], product_url: p(1055), sponsored: false },
  { id: "fix-056", name: "Industrial Cage Pendant Light",    tags: ["lamp","pendant","industrial","cage","ceiling"],image_url: u("1507473885765-e6ed057f782c",600), price: 99,   retailer_name: R[1], product_url: p(1056), sponsored: false },
  { id: "fix-057", name: "Rattan Woven Pendant",             tags: ["lamp","pendant","rattan","wicker","warm"],   image_url: u("1507473885765-e6ed057f782c",450),   price: 139,  retailer_name: R[2], product_url: p(1057), sponsored: false },
  { id: "fix-058", name: "Rechargeable Mushroom Table Lamp", tags: ["lamp","table","mushroom","cordless","portable"],image_url: u("1507473885765-e6ed057f782c",550),price: 79,   retailer_name: R[0], product_url: p(1058), sponsored: false },
  { id: "fix-059", name: "Linen Drum Shade Floor Lamp",      tags: ["lamp","floor","linen","drum","shade"],       image_url: u("1507473885765-e6ed057f782c",650),   price: 169,  retailer_name: R[1], product_url: p(1059), sponsored: false },
  { id: "fix-060", name: "Brass Adjustable Desk Lamp",       tags: ["lamp","desk","brass","adjustable","task"],   image_url: u("1507473885765-e6ed057f782c",300),   price: 89,   retailer_name: R[2], product_url: p(1060), sponsored: true  },

  // ── Plants & Planters ───────────────────────────────────────────────────────
  { id: "fix-061", name: "Large Fiddle Leaf Fig (Faux)",     tags: ["plant","fiddle","leaf","fig","faux","tall"], image_url: u("1416879595882-3373a0480b5b"),       price: 149,  retailer_name: R[0], product_url: p(1061), sponsored: false },
  { id: "fix-062", name: "Potted Monstera (Faux)",           tags: ["plant","monstera","tropical","faux","pot"],  image_url: u("1416879595882-3373a0480b5b",350),   price: 99,   retailer_name: R[1], product_url: p(1062), sponsored: false },
  { id: "fix-063", name: "Ceramic Planter (Large White)",    tags: ["planter","ceramic","white","pot","large"],   image_url: u("1416879595882-3373a0480b5b",500),   price: 69,   retailer_name: R[2], product_url: p(1063), sponsored: false },
  { id: "fix-064", name: "Hanging Macramé Planter",          tags: ["plant","hanging","macrame","bohemian"],      image_url: u("1416879595882-3373a0480b5b",600),   price: 49,   retailer_name: R[0], product_url: p(1064), sponsored: false },
  { id: "fix-065", name: "Snake Plant Arrangement",          tags: ["plant","snake","sansevieria","air","tall"],  image_url: u("1416879595882-3373a0480b5b",450),   price: 79,   retailer_name: R[1], product_url: p(1065), sponsored: false },
  { id: "fix-066", name: "Terracotta Pot with Cactus",       tags: ["plant","cactus","terracotta","succulent"],   image_url: u("1416879595882-3373a0480b5b",550),   price: 39,   retailer_name: R[2], product_url: p(1066), sponsored: false },

  // ── Rugs ────────────────────────────────────────────────────────────────────
  { id: "fix-067", name: "Persian Style Area Rug (5×8)",     tags: ["rug","persian","area","pattern","classic"],  image_url: u("1558618666-fcd25c85cd64"),          price: 349,  retailer_name: R[0], product_url: p(1067), sponsored: false },
  { id: "fix-068", name: "Shaggy Ivory Rug",                 tags: ["rug","shag","ivory","soft","plush"],         image_url: u("1558618666-fcd25c85cd64",350),      price: 249,  retailer_name: R[1], product_url: p(1068), sponsored: false },
  { id: "fix-069", name: "Jute Natural Fiber Rug",           tags: ["rug","jute","natural","woven","neutral"],    image_url: u("1558618666-fcd25c85cd64",500),      price: 199,  retailer_name: R[2], product_url: p(1069), sponsored: false },
  { id: "fix-070", name: "Geometric Print Area Rug",         tags: ["rug","geometric","modern","bold","pattern"],  image_url: u("1558618666-fcd25c85cd64",600),     price: 299,  retailer_name: R[0], product_url: p(1070), sponsored: false },
  { id: "fix-071", name: "Wool Kilim Rug",                   tags: ["rug","kilim","wool","handmade","boho"],      image_url: u("1558618666-fcd25c85cd64",450),      price: 499,  retailer_name: R[1], product_url: p(1071), sponsored: false },

  // ── Ottomans & Poufs ────────────────────────────────────────────────────────
  { id: "fix-072", name: "Round Velvet Ottoman",             tags: ["ottoman","velvet","round","footstool"],      image_url: u("1567538096630-e0c55bd6374c",300),   price: 169,  retailer_name: R[2], product_url: p(1072), sponsored: false },
  { id: "fix-073", name: "Leather Storage Ottoman",          tags: ["ottoman","leather","storage","bench"],       image_url: u("1550254478-ead40cc54513",300),      price: 299,  retailer_name: R[0], product_url: p(1073), sponsored: false },
  { id: "fix-074", name: "Moroccan Leather Pouf",            tags: ["pouf","moroccan","leather","bohemian"],      image_url: u("1567538096630-e0c55bd6374c",400),   price: 119,  retailer_name: R[1], product_url: p(1074), sponsored: false },
  { id: "fix-075", name: "Knit Chunky Pouf",                 tags: ["pouf","knit","chunky","cozy","textile"],     image_url: u("1550254478-ead40cc54513",450),      price: 89,   retailer_name: R[2], product_url: p(1075), sponsored: false },

  // ── Sideboards & Consoles ───────────────────────────────────────────────────
  { id: "fix-076", name: "Walnut Sideboard (4-door)",        tags: ["sideboard","walnut","storage","cabinet"],    image_url: u("1583847268964-b28dc8f51f92"),       price: 899,  retailer_name: R[0], product_url: p(1076), sponsored: false },
  { id: "fix-077", name: "Rattan Buffet Cabinet",            tags: ["buffet","rattan","cabinet","storage"],       image_url: u("1583847268964-b28dc8f51f92",350),   price: 599,  retailer_name: R[1], product_url: p(1077), sponsored: false },
  { id: "fix-078", name: "Entryway Console Table",           tags: ["console","entryway","table","narrow"],       image_url: u("1583847268964-b28dc8f51f92",500),   price: 349,  retailer_name: R[2], product_url: p(1078), sponsored: false },
  { id: "fix-079", name: "Lacquered White Sideboard",        tags: ["sideboard","lacquered","white","modern"],    image_url: u("1583847268964-b28dc8f51f92",600),   price: 749,  retailer_name: R[0], product_url: p(1079), sponsored: false },

  // ── Wardrobes & Dressers ────────────────────────────────────────────────────
  { id: "fix-080", name: "6-Drawer Dresser (White)",         tags: ["dresser","drawer","bedroom","white","storage"],image_url: u("1505693416388-ac5ce068fe85",600),price: 499,  retailer_name: R[1], product_url: p(1080), sponsored: false },
];
