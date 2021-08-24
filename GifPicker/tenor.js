const endpoint = "https://g.tenor.com/v1";
const key = "NVIY5F53SLFQ";
const defaultProps = { media_filter: "minimal", limit: 50 };

let lastFetch = 0;

export default new class {
    async executRequest(cmd, props = {}) {
        while (performance.now() - lastFetch < 500)
            await new Promise(r => setTimeout(r, 100));
        lastFetch = performance.now();

        // This line makes my brain go brr
        return await fetch(`${endpoint}/${cmd}?key=${key}${Object.entries({ ...defaultProps, ...props }).map(([key, value]) => `&${key}=${value}`).join("")}`)
            .then(response => response.json())
            .catch(console.error);
    }
    
    getTrending(options = {}) {
        return this.executRequest("trending", options);
    }
    
    search(query, options = {}) {
        return this.executRequest("search", { q: query, ...options });
    }
}