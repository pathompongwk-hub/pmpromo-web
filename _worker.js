export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === "/auth") {
      const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=repo`;
      return Response.redirect(redirectUrl, 302);
    }
    
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code })
      });
      const data = await response.json();
      const token = data.access_token;
      const html = `<!DOCTYPE html><html><body><script>
        window.opener.postMessage('authorization:github:success:{"token":"${token}","provider":"github"}', '*');
      </script></body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }
    
    return env.ASSETS.fetch(request);
  }
}
