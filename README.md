# Countdown Timer + Analytics — Shopify App

A Shopify app that allows merchants to add countdown timers for special promotions and discounts on their product pages, with built-in analytics tracking.

## Features

- **Fixed Timers**: Set specific start and end dates for promotions
- **Evergreen Timers**: Session-based timers that reset per visitor (stored in localStorage)
- **Flexible Targeting**: Apply timers to all products, specific products, or collections
- **Customization**: Customize timer appearance (colors, position, text, title, description) to match your brand
- **Analytics**: Track impression counts for each timer
- **Visual Urgency**: Visual cues when timers are close to expiring

## Tech Stack

- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React + Shopify Polaris
- **Storefront Widget**: Preact (Theme App Extension)
- **CLI**: Shopify CLI 3.0

## Prerequisites

1. Node.js 18+ and npm
2. MongoDB (local or cloud instance)
3. Shopify Partners account
4. Development store
5. ngrok account (for local development with Shopify admin)

## Setup Instructions

### 1. Set Up ngrok Tunnel

ngrok is required to expose your local development server to Shopify. Follow these steps:

#### Install ngrok

1. **Sign up for a free ngrok account** at https://dashboard.ngrok.com/signup
2. **Download ngrok** from https://ngrok.com/download
3. **Extract and add to PATH** (or place in a directory accessible from terminal)

#### Authenticate ngrok

After installation, authenticate with your ngrok account:

```bash
ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
```

You can find your authtoken in the ngrok dashboard: https://dashboard.ngrok.com/get-started/your-authtoken

#### Start ngrok Tunnel

Open a new terminal window and start ngrok to forward traffic to your backend server:

```bash
ngrok http 3000
```

**Note:** Make sure your backend server is running on port 3000 (or adjust the port accordingly).

#### Get Your ngrok URL

After starting ngrok, you'll see output like:

```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`) - this is your ngrok URL.

#### Update Configuration

1. **Update `.env` file** with your ngrok URL:
   ```env
   SHOPIFY_APP_URL=https://abc123.ngrok-free.app
   ```

2. **Update `shopify.app.toml`**:
   ```toml
   application_url = "https://abc123.ngrok-free.app"
   ```

3. **Update frontend `.env`** (if needed):
   ```env
   VITE_API_URL=https://abc123.ngrok-free.app
   VITE_SHOPIFY_APP_URL=https://abc123.ngrok-free.app
   ```

**Important Notes:**
- Keep the ngrok terminal window open while developing
- The ngrok URL changes each time you restart ngrok (unless you have a paid plan with static domains)
- Update your `.env` and `shopify.app.toml` whenever the ngrok URL changes
- For production, use a static domain or hosting service instead of ngrok

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

#### Backend Environment Variables

Create a `.env` file in the root directory:

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=write_products,read_products,write_themes,read_themes
SHOPIFY_APP_URL=https://your-app-url.ngrok.io
MONGODB_URI=mongodb://localhost:27017/countdown-timer
PORT=3000
```

#### Frontend Environment Variables (Optional)

Create a `.env` file in `app/frontend/` directory for frontend-specific configuration:

```env
# API Base URL (optional - defaults to proxy in development)
# For Shopify admin (ngrok), set this to your backend ngrok URL
VITE_API_URL=http://localhost:3001

# Shopify App URL (optional - for ResourcePicker)
VITE_SHOPIFY_APP_URL=https://your-app-url.ngrok.io
```

**Note:** 
- In Vite, environment variables must be prefixed with `VITE_` to be accessible in the browser
- For local development, the proxy handles API requests automatically
- Only set `VITE_API_URL` if you need to override the default proxy behavior (e.g., when testing in Shopify admin)

### 4. Update shopify.app.toml

Update the `shopify.app.toml` file with your app credentials:
- `client_id`: Your Shopify API key
- `application_url`: Your app URL
- `dev_store_url`: Your development store URL

### 5. Run the App

```bash
npm run dev
```

This will start the development server and open the Shopify CLI tunnel.

## Architecture Decisions

### Backend Architecture: Controller-Repository Pattern

The backend follows a layered architecture for better separation of concerns:

```
Routes → Controllers → Repositories → Models
```

- **Routes** (`app/routes/`): Handle HTTP routing and delegate to controllers
- **Controllers** (`app/controllers/`): Handle business logic and HTTP request/response
- **Repositories** (`app/repositories/`): Abstract data access layer
- **Models** (`app/models/`): MongoDB schemas and document methods

**Benefits:**
- Better testability (controllers and repositories can be tested independently)
- Improved maintainability (business logic centralized)
- Code reusability (repository methods can be shared)
- Easy to swap data sources (change repository implementation)

### Validation: Joi Schema-Based Validation

- **Joi** is used for input validation instead of express-validator
- Declarative schema definitions with conditional validation
- Built-in sanitization and type safety
- Better error messages for API consumers
- Validation middleware validates before controllers receive data

### Multi-Tenant Data Isolation

All timer data is isolated by `shop` field in MongoDB, ensuring merchants can only access their own timers. API endpoints validate shop ownership on every request. Repository layer enforces shop isolation at the data access level.

### Theme App Extension vs ScriptTag

We use Theme App Extensions instead of ScriptTags for better:
- Performance (lazy loading, code splitting)
- User experience (no layout shifts)
- Maintainability (version control, easier updates)

### Timer Data Fetching Strategy

The storefront widget uses a single optimized API call with:
- HTTP caching headers (Cache-Control)
- Efficient JSON response (<5KB typical)
- Graceful degradation on network failures

### Evergreen Timer Implementation

Evergreen timers use localStorage to track per-visitor session state:
- Timer start time stored on first visit
- Expiry calculated client-side
- Automatic reset on expiry or session end

## API Endpoints

### Admin API (Authenticated)

- `GET /api/timers` - List all timers for the shop
- `POST /api/timers` - Create a new timer
- `GET /api/timers/:id` - Get a specific timer
- `PUT /api/timers/:id` - Update a timer
- `DELETE /api/timers/:id` - Delete a timer
- `GET /api/timers/:id/analytics` - Get analytics for a timer

### Public API (Storefront)

- `GET /api/public/timer` - Get active timer for a product (query params: `productId`, `shop`)

## Performance Optimizations

1. **Widget Bundle Size**: Preact instead of React, tree-shaking, code splitting
2. **API Caching**: HTTP cache headers for timer data (5-minute TTL)
3. **Database Indexing**: Indexed on `shop` and `status` fields for fast queries
4. **Lazy Loading**: Widget only loads when product page is detected

## Security Measures

1. **Shop Validation**: All API endpoints validate shop ownership via session
2. **Input Sanitization**: All user inputs sanitized to prevent XSS
3. **Rate Limiting**: API endpoints have rate limiting (100 req/min per shop)
4. **HTTPS Only**: All API calls require HTTPS in production

## Testing

Run tests with:

```bash
npm test
```

Test coverage includes:
- Timer creation and validation
- Evergreen timer logic
- Targeting rules (products/collections)
- Analytics tracking
- API authentication

## Project Structure

```
.
├── app/                    # Backend application
│   ├── controllers/       # Business logic controllers
│   ├── repositories/       # Data access layer
│   ├── validators/         # Joi validation schemas
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes (thin layer)
│   ├── middleware/        # Express middleware
│   ├── tests/             # Unit tests
│   ├── frontend/          # React admin frontend
│   └── server.js          # Express server
├── extensions/            # Theme App Extensions
│   └── countdown-timer/   # Preact widget
├── shopify.app.toml       # Shopify app configuration
└── package.json           # Root package.json
```

## Assumptions Made

1. Merchants have basic understanding of Shopify admin
2. Storefront themes support Theme App Extensions (Shopify 2.0 themes)
3. MongoDB connection is reliable (retry logic implemented)
4. Shop domain format is consistent (shop.myshopify.com)
5. Product IDs are available in the DOM or URL for timer targeting

## Development Workflow

1. **Backend Development**: Work in `app/` directory
2. **Frontend Development**: Work in `app/frontend/` directory
3. **Extension Development**: Work in `extensions/countdown-timer/` directory
4. **Testing**: Run `npm test` from `app/` directory

## Build Process

### Frontend
```bash
cd app/frontend
npm run build
```

### Extension
```bash
cd extensions/countdown-timer
npm run build
```

The extension build process:
1. Bundles Preact code with Vite
2. Minifies and tree-shakes
3. Copies to `assets/countdown-timer.js`
4. Target bundle size: <30KB gzipped

## Deployment

1. Set production environment variables
2. Build frontend and extension
3. Deploy backend to hosting service (Heroku, Railway, etc.)
4. Update `shopify.app.toml` with production URLs
5. Run `shopify app deploy`

## Future Improvements

- Real-time analytics dashboard
- A/B testing for timer effectiveness
- Advanced targeting (customer segments, geolocation)
- Email notifications for timer expiry
- Bulk timer operations
- Timer templates/presets
- Webhook support for timer status changes
- Advanced analytics (conversion tracking, A/B testing)

## License

MIT

