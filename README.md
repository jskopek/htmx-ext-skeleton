# htmx-ext-skeleton

An htmx extension for displaying skeleton screens during requests.

## Installation

### Via CDN

```html
<script src="https://unpkg.com/htmx.org"></script>
<script src="https://unpkg.com/htmx-ext-skeleton"></script> 
```

### Via npm

```bash
npm install htmx-ext-skeleton
```

Then import in your JavaScript:

```javascript
import 'htmx.org';
import 'htmx-ext-skeleton';
```

## Usage

### Basic Usage (Default Skeleton)

1. Define a skeleton template with `id="skeleton"`:

```html
<script type="text/template" id="skeleton">
  <div class="skeleton-placeholder">
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
  </div>
</script>
```

2. Add `hx-ext="skeleton"` to your htmx element:

```html
<div hx-ext="skeleton" hx-get="/api/data" hx-target="#content">
  Load Data
</div>

<div id="content">
  <!-- Initial content here -->
</div>
```

### Custom Skeleton (Optional)

If you need multiple different skeletons, specify a custom template ID:

```html
<script type="text/template" id="custom-skeleton">
  <div class="custom-loading">...</div>
</script>

<div hx-ext="skeleton"
     hx-get="/api/data"
     hx-target="#content"
     hx-skeleton="custom-skeleton">
  Load Data
</div>
```

### Alpine.js Integration (Optional)

If Alpine.js is detected, you can override and extend data in your skeleton template using `hx-skeleton-alpine`:

```html
<script type="text/template" id="skeleton">
  <div x-data="{ title: 'Loading...', count: 3 }">
    <h3 x-text="title"></h3>
    <template x-for="i in count" :key="i">
      <div class="skeleton-item"></div>
    </template>
  </div>
</script>

<div hx-ext="skeleton"
     hx-get="/api/data"
     hx-target="#content"
     hx-skeleton-alpine='{"title": "Loading Projects", "count": 5}'>
  Load Data
</div>
```
## Features

- **Zero configuration**: Just add `hx-ext="skeleton"` and create a template with `id="skeleton"`
- **Instant feedback**: Shows skeleton immediately when request starts
- **Automatic cleanup**: Removes skeleton when new content arrives
- **Error handling**: Restores original content if request fails
- **History support**: Properly handles browser back/forward navigation
- **Multiple skeletons**: Override with `hx-skeleton="custom-id"` for custom templates
- **Alpine.js support**: Optional integration with Alpine.js for dynamic skeleton templates

## How it works

1. When an htmx request starts (`htmx:beforeRequest`), the extension:
   - Saves the original content
   - Replaces it with the skeleton template
   - Adds a `skeleton-loading` class

2. When the response arrives (`htmx:beforeSwap`), the extension:
   - Removes the `skeleton-loading` class
   - Allows htmx to swap in the new content

3. If an error occurs, the extension:
   - Restores the original content
   - Removes the `skeleton-loading` class

## Styling

Add CSS to style your skeleton screens:

```css
.skeleton-loading {
  pointer-events: none;
  opacity: 0.7;
}

.skeleton-line {
  height: 1rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  margin-bottom: 0.5rem;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## License

MIT
