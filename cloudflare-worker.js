// CloudFlare Worker Script to prevent caching of exchange rates
// Deploy this as a CloudFlare Worker on your domain

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Check if this is an exchange rate API call
  if (url.pathname.startsWith('/api/exchange-rates')) {
    console.log('Exchange rate API detected, applying no-cache policy')
    
    // Forward the request to your origin
    const response = await fetch(request)
    
    // Clone the response so we can modify headers
    const newResponse = new Response(response.body, response)
    
    // Force no caching headers
    newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0')
    newResponse.headers.set('Pragma', 'no-cache')
    newResponse.headers.set('Expires', '-1')
    newResponse.headers.delete('ETag')
    newResponse.headers.delete('Last-Modified')
    
    // Add timestamp to ensure uniqueness
    newResponse.headers.set('X-Timestamp', Date.now().toString())
    newResponse.headers.set('X-No-Cache', 'FORCED-BY-WORKER')
    
    // Add CORS headers if needed
    newResponse.headers.set('Access-Control-Allow-Origin', '*')
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return newResponse
  }
  
  // For all other requests, pass through normally
  return fetch(request)
}

// Alternative approach: Add query parameter to prevent caching
function addNoCacheParam(url) {
  const urlObj = new URL(url)
  urlObj.searchParams.set('_nocache', Date.now().toString())
  return urlObj.toString()
}