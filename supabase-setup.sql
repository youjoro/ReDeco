-- ============================================================
-- ReDeco — Supabase Setup Script
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- After running this script, also do ONE manual step:
--   Storage → New bucket → Name: "room-images" → Public: ON
-- ============================================================


-- ── 1. TABLES ────────────────────────────────────────────────

-- Rooms: one row per saved moodboard
CREATE TABLE IF NOT EXISTS public.rooms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL DEFAULT 'Untitled Room',
  background  text,                        -- HTTPS URL or null
  items       jsonb NOT NULL DEFAULT '[]', -- array of canvas item objects
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Furniture catalog (demo data — seeded below)
CREATE TABLE IF NOT EXISTS public.furniture_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  tags          text[] NOT NULL DEFAULT '{}',
  price         numeric(10,2),
  image_url     text,
  retailer_name text,
  product_url   text,
  sponsored     boolean NOT NULL DEFAULT false
);

-- One shopping list per user
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name    text NOT NULL DEFAULT 'My Shopping List',
  UNIQUE (user_id)
);

-- Items inside a shopping list
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id       uuid NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  furniture_item_id      uuid NOT NULL REFERENCES public.furniture_items(id) ON DELETE CASCADE,
  quantity               integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  added_from_moodboard_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  created_at             timestamptz NOT NULL DEFAULT now()
);


-- ── 2. INDEXES ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS rooms_user_id_idx              ON public.rooms(user_id);
CREATE INDEX IF NOT EXISTS rooms_updated_at_idx           ON public.rooms(updated_at DESC);
CREATE INDEX IF NOT EXISTS shopping_lists_user_id_idx     ON public.shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS shopping_list_items_list_idx   ON public.shopping_list_items(shopping_list_id);


-- ── 3. ROW LEVEL SECURITY ────────────────────────────────────

ALTER TABLE public.rooms               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
-- furniture_items is public read, no RLS needed

-- rooms: users see and modify only their own rows
CREATE POLICY "rooms: own rows only" ON public.rooms
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- shopping_lists: users see and modify only their own list
CREATE POLICY "shopping_lists: own rows only" ON public.shopping_lists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- shopping_list_items: users access items that belong to their list
CREATE POLICY "shopping_list_items: own list only" ON public.shopping_list_items
  FOR ALL USING (
    shopping_list_id IN (
      SELECT id FROM public.shopping_lists WHERE user_id = auth.uid()
    )
  );

-- furniture_items: anyone (including unauthenticated) can read the catalog
CREATE POLICY "furniture_items: public read" ON public.furniture_items
  FOR SELECT USING (true);


-- ── 4. FURNITURE CATALOG SEED DATA ──────────────────────────
-- 80 demo items. Safe to re-run — skips existing rows by id.

INSERT INTO public.furniture_items (id, name, tags, price, image_url, retailer_name, product_url, sponsored) VALUES
-- Sofas & Sectionals
('00000000-0000-0000-0000-000000001001', 'Cloud Grey 3-Seater Sofa',        ARRAY['sofa','couch','grey','modern'],              899,  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80', 'Demo Store',       'https://example-store.com/product/1001', false),
('00000000-0000-0000-0000-000000001002', 'Velvet Navy Loveseat',             ARRAY['sofa','loveseat','velvet','navy'],           749,  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=400&q=80','Fauxfurn Co.',     'https://example-store.com/product/1002', false),
('00000000-0000-0000-0000-000000001003', 'Linen Sectional Sofa',             ARRAY['sectional','sofa','linen','large'],          1499, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80', 'Placeholder Living','https://example-store.com/product/1003', false),
('00000000-0000-0000-0000-000000001004', 'Mid-Century Teal Sofa',            ARRAY['sofa','mid-century','teal','retro'],         1099, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=500&q=80','Demo Store',       'https://example-store.com/product/1004', true),
('00000000-0000-0000-0000-000000001005', 'Compact Studio Sofa',              ARRAY['sofa','compact','small','studio'],           599,  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80', 'Fauxfurn Co.',     'https://example-store.com/product/1005', false),
('00000000-0000-0000-0000-000000001006', 'Chesterfield Sofa',                ARRAY['sofa','chesterfield','classic','button'],    1299, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=350&q=80','Placeholder Living','https://example-store.com/product/1006', false),
('00000000-0000-0000-0000-000000001007', 'Convertible Sleeper Sofa',         ARRAY['sofa','sleeper','convertible','bed'],        849,  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=450&q=80', 'Demo Store',       'https://example-store.com/product/1007', false),
('00000000-0000-0000-0000-000000001008', 'L-Shape Corner Sectional',         ARRAY['sectional','corner','L-shape','sofa'],       1699, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=650&q=80','Fauxfurn Co.',     'https://example-store.com/product/1008', false),
-- Armchairs & Accent Chairs
('00000000-0000-0000-0000-000000001009', 'Terracotta Accent Chair',          ARRAY['chair','armchair','terracotta','accent'],    449,  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=400&q=80','Placeholder Living','https://example-store.com/product/1009', false),
('00000000-0000-0000-0000-000000001010', 'Barrel Swivel Armchair',           ARRAY['chair','swivel','barrel','modern'],          389,  'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=400&q=80', 'Demo Store',       'https://example-store.com/product/1010', false),
('00000000-0000-0000-0000-000000001011', 'Wingback Reading Chair',           ARRAY['chair','wingback','reading','classic'],      629,  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=350&q=80','Fauxfurn Co.',     'https://example-store.com/product/1011', false),
('00000000-0000-0000-0000-000000001012', 'Egg Pod Chair',                    ARRAY['chair','egg','pod','lounge','modern'],       799,  'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=350&q=80', 'Placeholder Living','https://example-store.com/product/1012', true),
('00000000-0000-0000-0000-000000001013', 'Velvet Boudoir Chair',             ARRAY['chair','velvet','boudoir','glam'],           519,  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=500&q=80','Demo Store',       'https://example-store.com/product/1013', false),
('00000000-0000-0000-0000-000000001014', 'Scandi Accent Chair',              ARRAY['chair','scandinavian','minimal','wood'],     329,  'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=500&q=80', 'Fauxfurn Co.',     'https://example-store.com/product/1014', false),
('00000000-0000-0000-0000-000000001015', 'Rattan Lounge Chair',              ARRAY['chair','rattan','wicker','bohemian','lounge'],279, 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80','Placeholder Living','https://example-store.com/product/1015', false),
('00000000-0000-0000-0000-000000001016', 'Leather Club Chair',               ARRAY['chair','leather','club','brown','vintage'],  899,  'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=600&q=80', 'Demo Store',       'https://example-store.com/product/1016', false),
-- Dining Chairs
('00000000-0000-0000-0000-000000001017', 'Tulip Plastic Dining Chair',       ARRAY['chair','dining','tulip','plastic','modern'], 89,   'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=400&q=80','Fauxfurn Co.',     'https://example-store.com/product/1017', false),
('00000000-0000-0000-0000-000000001018', 'Windsor Wooden Dining Chair',      ARRAY['chair','dining','wooden','windsor'],         129,  'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=350&q=80','Placeholder Living','https://example-store.com/product/1018', false),
('00000000-0000-0000-0000-000000001019', 'Ghost Acrylic Chair',              ARRAY['chair','dining','acrylic','ghost','clear'],  179,  'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=500&q=80','Demo Store',       'https://example-store.com/product/1019', false),
('00000000-0000-0000-0000-000000001020', 'Eames Style Plywood Chair',        ARRAY['chair','dining','plywood','eames','organic'],219,  'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=600&q=80','Fauxfurn Co.',     'https://example-store.com/product/1020', false),
('00000000-0000-0000-0000-000000001021', 'Velvet Tufted Dining Chair',       ARRAY['chair','dining','velvet','tufted','upholstered'],159,'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=400&q=80','Placeholder Living','https://example-store.com/product/1021', false),
('00000000-0000-0000-0000-000000001022', 'Metal Hairpin Leg Chair',          ARRAY['chair','dining','metal','hairpin','industrial'],99,'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=450&q=80','Demo Store',      'https://example-store.com/product/1022', false),
-- Coffee Tables
('00000000-0000-0000-0000-000000001023', 'Marble Top Coffee Table',          ARRAY['table','coffee','marble','white','modern'],  549,  'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=400&q=80','Fauxfurn Co.',     'https://example-store.com/product/1023', false),
('00000000-0000-0000-0000-000000001024', 'Walnut Coffee Table',              ARRAY['table','coffee','walnut','wood','warm'],     399,  'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=350&q=80','Placeholder Living','https://example-store.com/product/1024', false),
('00000000-0000-0000-0000-000000001025', 'Round Rattan Coffee Table',        ARRAY['table','coffee','rattan','round','bohemian'],279,  'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=500&q=80','Demo Store',       'https://example-store.com/product/1025', false),
('00000000-0000-0000-0000-000000001026', 'Nesting Coffee Tables (set of 2)', ARRAY['table','coffee','nesting','set','flexible'], 349,  'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=600&q=80','Fauxfurn Co.',     'https://example-store.com/product/1026', false),
('00000000-0000-0000-0000-000000001027', 'Glass Top Coffee Table',           ARRAY['table','coffee','glass','metal','contemporary'],469,'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=450&q=80','Placeholder Living','https://example-store.com/product/1027', true),
('00000000-0000-0000-0000-000000001028', 'Lift-Top Storage Coffee Table',    ARRAY['table','coffee','storage','lift','multifunctional'],599,'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=650&q=80','Demo Store',   'https://example-store.com/product/1028', false),
('00000000-0000-0000-0000-000000001029', 'Ottoman Coffee Table (Velvet)',     ARRAY['ottoman','coffee','velvet','multipurpose'],  239,  'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=550&q=80','Fauxfurn Co.',     'https://example-store.com/product/1029', false),
-- Dining Tables
('00000000-0000-0000-0000-000000001030', 'Extendable Dining Table',          ARRAY['table','dining','extendable','wood'],        799,  'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=400&q=80','Placeholder Living','https://example-store.com/product/1030', false),
('00000000-0000-0000-0000-000000001031', 'Round Marble Dining Table',        ARRAY['table','dining','marble','round','white'],   1199, 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=350&q=80','Demo Store',       'https://example-store.com/product/1031', false),
('00000000-0000-0000-0000-000000001032', 'Farmhouse Dining Table',           ARRAY['table','dining','farmhouse','rustic','wood'],699,  'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=500&q=80','Fauxfurn Co.',     'https://example-store.com/product/1032', false),
('00000000-0000-0000-0000-000000001033', 'Glass Pedestal Dining Table',      ARRAY['table','dining','glass','pedestal','modern'],949,  'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600&q=80','Placeholder Living','https://example-store.com/product/1033', false),
('00000000-0000-0000-0000-000000001034', 'Industrial Metal Dining Table',    ARRAY['table','dining','industrial','metal','black'],549, 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=450&q=80','Demo Store',       'https://example-store.com/product/1034', false),
-- Beds & Bed Frames
('00000000-0000-0000-0000-000000001035', 'Platform Upholstered Bed',         ARRAY['bed','platform','upholstered','frame','grey'],849, 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80','Fauxfurn Co.',     'https://example-store.com/product/1035', false),
('00000000-0000-0000-0000-000000001036', 'Canopy Bed Frame (King)',           ARRAY['bed','canopy','king','wood','four-poster'],  1299, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80','Placeholder Living','https://example-store.com/product/1036', false),
('00000000-0000-0000-0000-000000001037', 'Rattan Headboard Bed',             ARRAY['bed','rattan','headboard','bohemian'],       699,  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=350&q=80','Demo Store',       'https://example-store.com/product/1037', false),
('00000000-0000-0000-0000-000000001038', 'Floating Platform Bed',            ARRAY['bed','platform','floating','minimalist'],    979,  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=350&q=80','Fauxfurn Co.',     'https://example-store.com/product/1038', true),
('00000000-0000-0000-0000-000000001039', 'Metal Bed Frame (Queen)',           ARRAY['bed','metal','queen','black','simple'],      399,  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=500&q=80','Placeholder Living','https://example-store.com/product/1039', false),
('00000000-0000-0000-0000-000000001040', 'Storage Bed with Drawers',         ARRAY['bed','storage','drawers','practical'],       1199, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=500&q=80','Demo Store',       'https://example-store.com/product/1040', false),
-- Desks & Work Areas
('00000000-0000-0000-0000-000000001041', 'Standing Desk (Electric)',         ARRAY['desk','standing','electric','adjustable','office'],799,'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=400&q=80','Fauxfurn Co.',  'https://example-store.com/product/1041', false),
('00000000-0000-0000-0000-000000001042', 'Floating Wall Desk',               ARRAY['desk','wall','floating','compact','minimal'],249,  'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=350&q=80','Placeholder Living','https://example-store.com/product/1042', false),
('00000000-0000-0000-0000-000000001043', 'Solid Oak Writing Desk',           ARRAY['desk','oak','wood','writing','classic'],     599,  'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=500&q=80','Demo Store',       'https://example-store.com/product/1043', false),
('00000000-0000-0000-0000-000000001044', 'L-Shape Corner Desk',              ARRAY['desk','corner','L-shape','large','office'],  449,  'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80','Fauxfurn Co.',     'https://example-store.com/product/1044', false),
('00000000-0000-0000-0000-000000001045', 'Vintage Secretary Desk',           ARRAY['desk','secretary','vintage','fold','retro'], 379,  'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=450&q=80','Placeholder Living','https://example-store.com/product/1045', false),
-- Shelves & Storage
('00000000-0000-0000-0000-000000001046', 'Open Bookcase (5-shelf)',          ARRAY['shelf','bookcase','open','books','tall'],    299,  'https://images.unsplash.com/photo-1565183928294-7063f23ce0f8?auto=format&fit=crop&w=400&q=80','Demo Store',       'https://example-store.com/product/1046', false),
('00000000-0000-0000-0000-000000001047', 'Floating Wall Shelves (set of 3)', ARRAY['shelf','floating','wall','set','minimal'],   129,  'https://images.unsplash.com/photo-1565183928294-7063f23ce0f8?auto=format&fit=crop&w=350&q=80','Fauxfurn Co.',     'https://example-store.com/product/1047', false),
('00000000-0000-0000-0000-000000001048', 'Ladder Shelf',                     ARRAY['shelf','ladder','leaning','modern','open'],  199,  'https://images.unsplash.com/photo-1565183928294-7063f23ce0f8?auto=format&fit=crop&w=500&q=80','Placeholder Living','https://example-store.com/product/1048', false),
('00000000-0000-0000-0000-000000001049', 'Modular Cube Shelving Unit',       ARRAY['shelf','cube','modular','storage','box'],    349,  'https://images.unsplash.com/photo-1565183928294-7063f23ce0f8?auto=format&fit=crop&w=600&q=80','Demo Store',       'https://example-store.com/product/1049', true),
('00000000-0000-0000-0000-000000001050', 'Media Console & Shelving',         ARRAY['shelf','media','console','tv','storage'],    499,  'https://images.unsplash.com/photo-1565183928294-7063f23ce0f8?auto=format&fit=crop&w=450&q=80','Fauxfurn Co.',     'https://example-store.com/product/1050', false),
('00000000-0000-0000-0000-000000001051', 'Industrial Pipe Shelving',         ARRAY['shelf','industrial','pipe','metal','wood'],  259,  'https://images.unsplash.com/photo-1565183928294-7063f23ce0f8?auto=format&fit=crop&w=550&q=80','Placeholder Living','https://example-store.com/product/1051', false),
('00000000-0000-0000-0000-000000001052', 'Corner Floating Shelf',            ARRAY['shelf','corner','floating','compact'],       79,   'https://images.unsplash.com/photo-1565183928294-7063f23ce0f8?auto=format&fit=crop&w=650&q=80','Demo Store',       'https://example-store.com/product/1052', false),
-- Lamps
('00000000-0000-0000-0000-000000001053', 'Arc Floor Lamp',                   ARRAY['lamp','floor','arc','modern','light'],       189,  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80','Fauxfurn Co.',     'https://example-store.com/product/1053', false),
('00000000-0000-0000-0000-000000001054', 'Tripod Floor Lamp',                ARRAY['lamp','floor','tripod','wooden','nordic'],   149,  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=350&q=80','Placeholder Living','https://example-store.com/product/1054', false),
('00000000-0000-0000-0000-000000001055', 'Table Lamp (Marble Base)',         ARRAY['lamp','table','marble','ceramic','light'],   119,  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=500&q=80','Demo Store',       'https://example-store.com/product/1055', false),
('00000000-0000-0000-0000-000000001056', 'Industrial Cage Pendant Light',    ARRAY['lamp','pendant','industrial','cage','ceiling'],99, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80','Fauxfurn Co.',     'https://example-store.com/product/1056', false),
('00000000-0000-0000-0000-000000001057', 'Rattan Woven Pendant',             ARRAY['lamp','pendant','rattan','wicker','warm'],   139,  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=450&q=80','Placeholder Living','https://example-store.com/product/1057', false),
('00000000-0000-0000-0000-000000001058', 'Rechargeable Mushroom Table Lamp', ARRAY['lamp','table','mushroom','cordless','portable'],79,'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=550&q=80','Demo Store',      'https://example-store.com/product/1058', false),
('00000000-0000-0000-0000-000000001059', 'Linen Drum Shade Floor Lamp',      ARRAY['lamp','floor','linen','drum','shade'],       169,  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=650&q=80','Fauxfurn Co.',     'https://example-store.com/product/1059', false),
('00000000-0000-0000-0000-000000001060', 'Brass Adjustable Desk Lamp',       ARRAY['lamp','desk','brass','adjustable','task'],   89,   'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=300&q=80','Placeholder Living','https://example-store.com/product/1060', true),
-- Plants & Planters
('00000000-0000-0000-0000-000000001061', 'Large Fiddle Leaf Fig (Faux)',     ARRAY['plant','fiddle','leaf','fig','faux','tall'], 149,  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=80','Demo Store',       'https://example-store.com/product/1061', false),
('00000000-0000-0000-0000-000000001062', 'Potted Monstera (Faux)',           ARRAY['plant','monstera','tropical','faux','pot'],  99,   'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=350&q=80','Fauxfurn Co.',     'https://example-store.com/product/1062', false),
('00000000-0000-0000-0000-000000001063', 'Ceramic Planter (Large White)',    ARRAY['planter','ceramic','white','pot','large'],   69,   'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=500&q=80','Placeholder Living','https://example-store.com/product/1063', false),
('00000000-0000-0000-0000-000000001064', 'Hanging Macramé Planter',          ARRAY['plant','hanging','macrame','bohemian'],      49,   'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80','Demo Store',       'https://example-store.com/product/1064', false),
('00000000-0000-0000-0000-000000001065', 'Snake Plant Arrangement',          ARRAY['plant','snake','sansevieria','air','tall'],  79,   'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=450&q=80','Fauxfurn Co.',     'https://example-store.com/product/1065', false),
('00000000-0000-0000-0000-000000001066', 'Terracotta Pot with Cactus',       ARRAY['plant','cactus','terracotta','succulent'],   39,   'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=550&q=80','Placeholder Living','https://example-store.com/product/1066', false),
-- Rugs
('00000000-0000-0000-0000-000000001067', 'Persian Style Area Rug (5x8)',     ARRAY['rug','persian','area','pattern','classic'],  349,  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80','Demo Store',       'https://example-store.com/product/1067', false),
('00000000-0000-0000-0000-000000001068', 'Shaggy Ivory Rug',                 ARRAY['rug','shag','ivory','soft','plush'],         249,  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=350&q=80','Fauxfurn Co.',     'https://example-store.com/product/1068', false),
('00000000-0000-0000-0000-000000001069', 'Jute Natural Fiber Rug',           ARRAY['rug','jute','natural','woven','neutral'],    199,  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=500&q=80','Placeholder Living','https://example-store.com/product/1069', false),
('00000000-0000-0000-0000-000000001070', 'Geometric Print Area Rug',         ARRAY['rug','geometric','modern','bold','pattern'],  299, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80','Demo Store',       'https://example-store.com/product/1070', false),
('00000000-0000-0000-0000-000000001071', 'Wool Kilim Rug',                   ARRAY['rug','kilim','wool','handmade','boho'],      499,  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=450&q=80','Fauxfurn Co.',     'https://example-store.com/product/1071', false),
-- Ottomans & Poufs
('00000000-0000-0000-0000-000000001072', 'Round Velvet Ottoman',             ARRAY['ottoman','velvet','round','footstool'],      169,  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=300&q=80','Placeholder Living','https://example-store.com/product/1072', false),
('00000000-0000-0000-0000-000000001073', 'Leather Storage Ottoman',          ARRAY['ottoman','leather','storage','bench'],       299,  'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=300&q=80','Demo Store',       'https://example-store.com/product/1073', false),
('00000000-0000-0000-0000-000000001074', 'Moroccan Leather Pouf',            ARRAY['pouf','moroccan','leather','bohemian'],      119,  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=400&q=80','Fauxfurn Co.',     'https://example-store.com/product/1074', false),
('00000000-0000-0000-0000-000000001075', 'Knit Chunky Pouf',                 ARRAY['pouf','knit','chunky','cozy','textile'],     89,   'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=450&q=80','Placeholder Living','https://example-store.com/product/1075', false),
-- Sideboards & Consoles
('00000000-0000-0000-0000-000000001076', 'Walnut Sideboard (4-door)',        ARRAY['sideboard','walnut','storage','cabinet'],    899,  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=400&q=80','Demo Store',       'https://example-store.com/product/1076', false),
('00000000-0000-0000-0000-000000001077', 'Rattan Buffet Cabinet',            ARRAY['buffet','rattan','cabinet','storage'],       599,  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=350&q=80','Fauxfurn Co.',     'https://example-store.com/product/1077', false),
('00000000-0000-0000-0000-000000001078', 'Entryway Console Table',           ARRAY['console','entryway','table','narrow'],       349,  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=500&q=80','Placeholder Living','https://example-store.com/product/1078', false),
('00000000-0000-0000-0000-000000001079', 'Lacquered White Sideboard',        ARRAY['sideboard','lacquered','white','modern'],    749,  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80','Demo Store',       'https://example-store.com/product/1079', false),
-- Wardrobes & Dressers
('00000000-0000-0000-0000-000000001080', '6-Drawer Dresser (White)',         ARRAY['dresser','drawer','bedroom','white','storage'],499, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80','Fauxfurn Co.',     'https://example-store.com/product/1080', false)

ON CONFLICT (id) DO NOTHING;


-- ── 5. DONE ──────────────────────────────────────────────────
-- Tables, RLS policies, indexes, and seed data are all set.
--
-- ONE remaining manual step:
--   Supabase Dashboard → Storage → New bucket
--   Name:   room-images
--   Public: ON  (toggle must be enabled so canvas images load)
-- ============================================================
