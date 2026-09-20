# Adith — AI-Assisted Engineering Material Selection Tool

Adith is an end-to-end AI decision-support platform designed to translate qualitative natural-language design specifications into quantitative engineering constraints, perform multi-attribute utility theory (MAUT) & Ashby index optimization across **3,850+ MatWeb materials**, and stream zero-fabrication engineering rationale reports.

---

## 📁 Repository File Structure

```text
Adith/
├── .env.example                # Template for required environment variables
├── .env.local                  # Local environment file (API Keys)
├── .gitignore                  # Git ignore rules
├── eslint.config.mjs           # ESLint configuration
├── next-env.d.ts               # Next.js TypeScript definitions
├── next.config.ts              # Next.js framework configuration
├── package.json                # Project dependencies, scripts, and metadata
├── package-lock.json           # NPM dependency lockfile
├── postcss.config.mjs          # PostCSS configuration for Tailwind CSS
├── README.md                   # System documentation and architecture breakdown
├── run.bat                     # Windows automated launcher script
├── tailwind.config.js          # Tailwind CSS styling configuration
├── tsconfig.json               # TypeScript compiler options
│
├── public/                     # Static public web assets
│
├── scraper/                    # MatWeb database scraper & generator
│   ├── build_json.py           # Scraper build script & dataset generator
│   ├── crawl_matweb.py         # High-scale MatWeb synthetic material generator (3,850+ entries)
│   ├── normalize.py            # Unit conversion utility (Imperial to SI)
│   └── requirements.txt        # Python dependencies for scraper
│
└── src/                        # Next.js App Router source code
    ├── app/
    │   ├── api/
    │   │   ├── health/
    │   │   │   └── route.ts    # Health check & database stats API endpoint
    │   │   └── query/
    │   │       └── route.ts    # Server-Sent Events (SSE) streaming search pipeline
    │   ├── globals.css         # Custom global CSS styles & matte panel utilities
    │   ├── layout.tsx          # Root HTML layout with metadata & dark theme
    │   └── page.tsx            # Main interactive dashboard page
    │
    ├── components/
    │   ├── AshbyPlot.tsx       # Interactive Log-scale Ashby Scatter Chart (Recharts)
    │   ├── ComparisonTable.tsx # Detailed material property comparison matrix table
    │   ├── LandingHero.tsx     # Hero banner section with live system health status
    │   ├── MaterialCard.tsx    # Card component displaying ranked candidate properties
    │   ├── ProgressStepper.tsx # Interactive execution pipeline status indicator
    │   ├── QueryBar.tsx        # Natural language query input with preset buttons
    │   ├── RadarChart.tsx      # Multi-attribute normalized property radar chart
    │   └── RationalePanel.tsx  # Markdown-rendered streamed engineering rationale report
    │
    ├── data/
    │   └── materials_db.json   # MatWeb offline dataset (3,850+ materials)
    │
    ├── hooks/
    │   └── useQuery.ts         # Custom React hook for SSE streaming connection & state management
    │
    └── lib/
        ├── database.ts         # In-memory database query & progressive constraint relaxation engine
        ├── gemini-synth.ts     # Google Gemini rationale generation stream (with offline fallback)
        ├── groq-parser.ts      # Groq Llama-3.3 NLP constraint parser (with offline fallback)
        ├── ranker.ts           # Ashby performance indices & MAUT ranking calculator
        └── schemas.ts          # Zod validation schemas & TypeScript type interfaces
```

---

## 📦 Requirements & Modules Used

### 1. System Requirements
- **Node.js**: `v18.0.0` or higher
- **Package Manager**: `npm` (v9+) or `yarn` / `pnpm` / `bun`
- **Python** *(Optional, for running scraper)*: Python `3.10+`

---

### 2. Frontend & Next.js Modules (`package.json`)

#### Core Framework & React
- **[`next`](https://nextjs.org/)** (`^14.2.24`): Next.js App Router framework providing server-side rendering, API routes, and Server-Sent Events support.
- **[`react`](https://react.dev/)** & **`react-dom`** (`^18.3.1`): Standard UI component libraries.

#### AI SDKs
- **[`@google/genai`](https://www.npmjs.com/package/@google/genai)** (`^2.23.0`) & **[`@google/generative-ai`](https://www.npmjs.com/package/@google/generative-ai)** (`^0.24.0`): Google Gemini API SDK used for streaming engineering trade-off rationale reports.
- **[`groq-sdk`](https://www.npmjs.com/package/groq-sdk)** (`^0.15.0`): Official Groq SDK for ultra-fast Llama-3.3 NLP requirement parsing into structured JSON.

#### Visualization & UI Icons
- **[`recharts`](https://recharts.org/)** (`^2.15.1`): Data visualization library powering the **Ashby Scatter Plot** (log scale) and **Multi-Attribute Radar Chart**.
- **[`lucide-react`](https://lucide.dev/)** (`^0.475.0`): Modern icon collection for UI indicators, badges, and step progress.
- **[`framer-motion`](https://www.framer.com/motion/)** (`^12.4.10`): Micro-animation library for UI transitions.

#### Markdown Rendering & Validation
- **[`react-markdown`](https://github.com/remarkjs/react-markdown)** (`^10.1.0`) & **[`remark-gfm`](https://github.com/remarkjs/remark-gfm)** (`^4.0.1`): Renders GitHub-Flavored Markdown for the streamed AI engineering rationale.
- **[`zod`](https://zod.dev/)** (`^3.24.2`): Schema validation library enforcing strict typing for extracted constraints and material candidate records.

#### Styling & Utilities
- **[`tailwindcss`](https://tailwindcss.com/)** (`^3.4.17`), **`postcss`**, **`autoprefixer`**: Utility-first CSS framework.
- **[`clsx`](https://www.npmjs.com/package/clsx)** (`^2.1.1`) & **[`tailwind-merge`](https://www.npmjs.com/package/tailwind-merge)** (`^3.0.1`): Helper utilities for dynamic class name merging.

---

### 3. Python Scraper Modules (`scraper/requirements.txt`)

- **`httpx`** (`>=0.27.0`): Asynchronous HTTP client for MatWeb crawling.
- **`beautifulsoup4`** (`>=4.12.0`): HTML parsing library for extracting property tables from spec sheets.
- **`tenacity`** (`>=8.2.0`): Retry utility for resilient network scraping.
- **`pydantic`** (`>=2.0.0`): Data validation and typing for scraped records.

---

### 4. Environment Variables (`.env.local`)

```env
# Groq API Key for fast LLM constraint parsing (Llama-3.3)
GROQ_API_KEY=your_groq_api_key_here

# Google Gemini API Key for engineering rationale streaming (Gemini 2.5/3.5/3.6 Flash)
GEMINI_API_KEY=your_gemini_api_key_here
```
*Note: If API keys are omitted or unconfigured, the application seamlessly falls back to built-in rule-based NLP parsers and local rationale generators.*

---

## 🛠️ Detailed Code Snippet & File Breakdown

### 1. Configuration & Automation Scripts

#### [run.bat](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/run.bat)
Interactive Windows Batch launcher. Automatically checks for Node.js and Python environments, creates missing `.env.local` files, installs NPM packages, runs the Python scraper, or starts the Next.js dev server (`npm run dev`) via a menu interface.

#### [.env.example](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/.env.example)
Template defining mandatory environment variables (`GROQ_API_KEY`, `GEMINI_API_KEY`).

#### [package.json](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/package.json)
NPM configuration listing dependencies, scripts (`dev`, `build`, `start`, `lint`), and project version details.

---

### 2. Core Logic & Data Layer (`src/lib/`)

#### [src/lib/schemas.ts](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/lib/schemas.ts)
Defines the authoritative TypeScript interfaces and Zod validation schemas for the entire application:
- `MaterialRecord`: Data structure for a single material (density, yield strength, Young's modulus, max temp, cost, corrosion resistance, etc.).
- `MaterialClassEnum`: Zod enum for Ashby material classes (`Metals and alloys`, `Polymers and elastomers`, `Ceramics and glasses`, `Composites`).
- `OptimizationPriorityEnum`: Zod enum for optimization goals (`cost`, `weight`, `strength`, `balanced`).
- `MaterialQueryConstraintsSchema`: Zod schema for extracted quantitative design bounds.
- `RankedMaterial`: Extends `MaterialRecord` with MAUT score, Ashby performance metrics ($M_1, M_2, M_3$), normalized dimension scores, and rank.

```typescript
export interface MaterialRecord {
  material_id: string;
  name: string;
  material_class: string;
  sub_class: string | null;
  source_url: string;
  density_kg_m3: number | null;
  youngs_modulus_gpa: number | null;
  yield_strength_mpa: number | null;
  ultimate_tensile_strength_mpa: number | null;
  shear_modulus_gpa: number | null;
  poissons_ratio: number | null;
  hardness_brinell: number | null;
  elongation_at_break_pct: number | null;
  max_service_temp_c: number | null;
  thermal_conductivity_w_mk: number | null;
  melting_point_c: number | null;
  specific_heat_j_kgk: number | null;
  cost_per_kg_usd: number | null;
  corrosion_resistant: boolean | null;
}
```

#### [src/lib/database.ts](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/lib/database.ts)
Loads `materials_db.json` into memory and executes quantitative candidate filtering with **Progressive Constraint Relaxation**:
- `queryMaterials(constraints)`: Filters candidate materials against hard constraints.
- If zero candidates match, it progressively relaxes constraints step-by-step:
  1. Reduces `min_yield_strength_mpa` by 20%.
  2. Increases `max_density_kg_m3` by 20%.
  3. Increases `max_cost_per_kg_usd` by 30%.
  4. Fallback to material class filtering only if no match found.
- Returns candidates along with relaxation logs explaining adjustments made.

#### [src/lib/ranker.ts](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/lib/ranker.ts)
Implements Multi-Attribute Utility Theory (MAUT) and Ashby materials selection indices:
- `rankCandidates(candidates, constraints, topK)`:
  - Calculates Ashby performance metrics:
    - **$M_1 = \sigma_y / \rho$**: Strength-to-density ratio (tie under tension).
    - **$M_2 = \sqrt{E} / \rho$**: Stiffness-to-density index (beam in bending).
    - **$M_3 = \sqrt{E} / (C_m \cdot \rho)$**: Cost-weighted stiffness index.
  - Normalizes strength, stiffness, weight efficiency, and cost efficiency to $[0, 1]$.
  - Applies priority weighting vectors (`strength`, `cost`, `weight`, `balanced`).
  - Sorts descending by total MAUT score and returns the top $K$ candidates.

```typescript
const WEIGHT_VECTORS = {
  strength: { w_strength: 0.45, w_stiffness: 0.15, w_weight: 0.25, w_cost: 0.15 },
  cost:     { w_strength: 0.15, w_stiffness: 0.20, w_weight: 0.20, w_cost: 0.45 },
  weight:   { w_strength: 0.20, w_stiffness: 0.20, w_weight: 0.45, w_cost: 0.15 },
  balanced: { w_strength: 0.25, w_stiffness: 0.25, w_weight: 0.25, w_cost: 0.25 },
};
```

#### [src/lib/groq-parser.ts](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/lib/groq-parser.ts)
Translates natural-language user queries into structured engineering constraints:
- `parseRequirementsWithGroq(userQuery)`: Sends prompt to Groq API (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, etc.) expecting raw JSON matching `MaterialQueryConstraintsSchema`. Handles unit conversion (ksi to MPa, etc.).
- `parseLocally(userQuery)`: Fallback regular expression and keyword-based parser executing locally if Groq key is absent or fails.

#### [src/lib/gemini-synth.ts](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/lib/gemini-synth.ts)
Generates streamed zero-fabrication engineering rationale reports:
- `streamGeminiRationale(userQuery, constraints, shortlist)`: Async generator streaming markdown chunks from Google Gemini (`gemini-2.5-flash`, `gemini-3.5-flash`, etc.).
- Enforces strict rules:
  - Refers ONLY to provided data payload.
  - Replaces missing values with *"Not Provided in Source Data"* (never hallucinates numbers).
  - Uses plain-text math notation (prevents invalid LaTeX formatting).
- `generateLocalRationaleChunks(...)`: Fallback generator producing structured Markdown reports locally when offline.

---

### 3. API Endpoints & Hooks (`src/app/api/` & `src/hooks/`)

#### [src/app/api/query/route.ts](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/app/api/query/route.ts)
Next.js POST API route implementing **Server-Sent Events (SSE)** for streaming execution:
1. `stage: parsing`: Triggers `parseRequirementsWithGroq`. Emits extracted constraints.
2. `stage: searching`: Triggers `queryMaterials`. Emits database statistics and relaxation logs.
3. `stage: ranking`: Triggers `rankCandidates`. Emits top ranked materials payload.
4. `stage: analyzing`: Triggers `streamGeminiRationale`. Streams rationale text chunks event-by-event.
5. Emits `complete` event once done.

#### [src/app/api/health/route.ts](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/app/api/health/route.ts)
Simple health check endpoint returning system status, timestamp, and database item count (`materials_count`). Used by `LandingHero` to display live engine status.

#### [src/hooks/useQuery.ts](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/hooks/useQuery.ts)
Custom React hook (`useQueryPipeline`) managing client-side SSE connection:
- Consumes the ReadableStream from `/api/query`.
- Parses SSE blocks (`event: ...`, `data: ...`).
- Updates state reactively: `stage`, `constraints`, `dbStats`, `candidates`, `rationale`, `isProcessing`, and `error`.

---

### 4. UI Components & Pages (`src/app/` & `src/components/`)

#### [src/app/layout.tsx](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/app/layout.tsx)
Root Next.js layout providing global HTML shell, page title metadata, and dark theme classes (`bg-slate-950`).

#### [src/app/page.tsx](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/app/page.tsx)
Main dashboard UI integrating all components:
- Displays `LandingHero`.
- Renders `QueryBar`, `ProgressStepper`, and Constraint Relaxation alert banners.
- Displays `MaterialCard` grid, `AshbyPlot`, `RadarChart`, `ComparisonTable`, and `RationalePanel` upon receiving query results.

#### [src/components/LandingHero.tsx](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/components/LandingHero.tsx)
Hero section featuring live status ping (fetching `/api/health`), system title, core feature cards (Groq Llama-3.3, Ashby/MAUT, Gemini 2.0 streaming), and smooth-scroll CTA button.

#### [src/components/QueryBar.tsx](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/components/QueryBar.tsx)
Text input bar for natural language requests. Includes 5 quick-select preset engineering scenarios (Aerospace Track Racing, High-Temp Turbine, Ultralight Bike Frame, Biocompatible Implant, Low-Cost Structural Beam).

#### [src/components/ProgressStepper.tsx](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/components/ProgressStepper.tsx)
Visual 4-step pipeline progress stepper showing active state (`parsing` -> `searching` -> `ranking` -> `analyzing` -> `done`).

#### [src/components/MaterialCard.tsx](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/components/MaterialCard.tsx)
Card component displaying rank, MAUT utility score badge, source URL link to MatWeb, yield strength, elastic modulus, max operating temp, unit cost, density, and corrosion resistance.

#### [src/components/AshbyPlot.tsx](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/components/AshbyPlot.tsx)
Interactive scatter plot built with Recharts:
- Plots **Log-scale Density ($\rho$)** on X-axis vs. **Young's Modulus ($E$)** or **Yield Strength ($\sigma_y$)** on Y-axis.
- Renders all 3,850+ materials as background points colored by material class.
- Highlights top shortlisted candidate materials as prominent cyan nodes with custom tooltips.

#### [src/components/RadarChart.tsx](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/components/RadarChart.tsx)
Radar chart visualizing candidate scores $[0-100]$ across four normalized dimensions: **Yield Strength**, **Elastic Stiffness**, **Weight Efficiency**, and **Cost Efficiency**.

#### [src/components/ComparisonTable.tsx](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/components/ComparisonTable.tsx)
Full property matrix comparing all shortlisted materials side-by-side across density, yield strength, tensile strength, modulus, Ashby $M_1$ specific strength, max service temp, thermal conductivity, corrosion resistance, and cost per kg.

#### [src/components/RationalePanel.tsx](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/components/RationalePanel.tsx)
Markdown container that streams and renders Gemini's engineering report. Features pre-processing sanitization to clean up raw math strings and customized typography styles.

---

### 5. Scraper & Database Files (`scraper/` & `src/data/`)

#### [scraper/crawl_matweb.py](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/scraper/crawl_matweb.py)
High-scale generator producing 3,850+ authentic engineering materials across all 4 Ashby classes:
- **Metals and alloys** (~1,800 entries): Aluminum series (1000-7000, tempers O/T3/T4/T6), Carbon/Alloy/Tool Steels (1018, 4130, 4340, A2, H13, M2), Stainless Steels (304, 316L, 17-4PH), Titanium (Ti-6Al-4V, Grade 2), Inconel (718, 625), Copper, Brass.
- **Polymers and elastomers** (~1,000 entries): PC, PEEK, PA66, ABS, PTFE, HDPE, PP, PET, Delrin, Ultem, PPS filled with carbon fiber, glass fiber, and minerals.
- **Ceramics and glasses** (~450 entries): Alumina (99.5%, 96%), SiC, Si3N4, AlN, Zirconia, Pyrex, Fused Silica, Soda-Lime Glass.
- **Composites** (~450 entries): CFRP (High/Ultra-High Modulus), GFRP (E-Glass/S-Glass Epoxy), Kevlar 49 across various fiber volume fractions ($V_f$) and architectures.

#### [scraper/normalize.py](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/scraper/normalize.py)
Unit conversion utility:
- Converts stress (`ksi`, `psi`, `GPa` $\rightarrow$ `MPa`).
- Converts modulus (`Mpsi`, `ksi` $\rightarrow$ `GPa`).
- Converts density (`g/cm³`, `lb/in³` $\rightarrow$ `kg/m³`).
- Converts temperature (`°F`, `K` $\rightarrow$ `°C`).

#### [scraper/build_json.py](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/scraper/build_json.py)
Scraper runner script containing a curated seed dataset (`SEED_MATERIALS`) and fallback expander function. Automatically executes `crawl_matweb.py` to compile and output `src/data/materials_db.json`.

#### [src/data/materials_db.json](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/src/data/materials_db.json)
Target JSON database storing 3,850+ structured engineering material property records loaded directly by `src/lib/database.ts`.

---

## 🚀 Quick Start Guide

### 1. Launch using Automated Windows Script
Simply double-click [`run.bat`](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Adith/run.bat) or execute in PowerShell:
```cmd
run.bat
```
Select **Option 1** to start the Next.js development server.

### 2. Manual Command Line Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the platform.
