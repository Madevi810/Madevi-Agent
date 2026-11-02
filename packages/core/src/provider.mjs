/** A deliberately small OpenAI-compatible text adapter. Keys stay in the environment. */
export async function completeWithProfile(profile, messages, { fetchImpl = fetch } = {}) {
  if (!profile?.baseUrl || !profile?.model || !profile?.apiKeyEnv) {
    throw new Error("Model profile is not connected. Configure baseUrl, model, and apiKeyEnv without placing the key in Madevi config.");
  }
  const apiKey = process.env[profile.apiKeyEnv];
  if (!apiKey) throw new Error("Missing model credential in environment variable: " + profile.apiKeyEnv);
  const response = await fetchImpl(profile.baseUrl.replace(/\/$/, "") + "/chat/completions", {
    method: "POST",
    headers: { authorization: "Bearer " + apiKey, "content-type": "application/json" },
    body: JSON.stringify({ model: profile.model, messages })
  });
  if (!response.ok) throw new Error("Model provider returned " + response.status + ".");
  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("Model provider returned no assistant text.");
  return content;
}
