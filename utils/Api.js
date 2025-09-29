// API function to send route to server
export async function send_route_to_server(new_route) {
  try {
    const response = await fetch("https://yus.kwscloud.in/yus/save-new-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(new_route),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error sending route to server:", error);
    throw error;
  }
}