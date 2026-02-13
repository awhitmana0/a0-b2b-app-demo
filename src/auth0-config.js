// Detect flow from URL parameter
const params = new URLSearchParams(window.location.search);
const flow = params.get('flow') || 'custom';

// Map flow to client_id
const getClientIdForFlow = (flow) => {
  const clientIds = {
    'credentials': import.meta.env.VITE_AUTH0_CLIENT_ID_PROMPT_CREDENTIALS,
    'organization': import.meta.env.VITE_AUTH0_CLIENT_ID_PROMPT_ORG,
    'no-prompt': import.meta.env.VITE_AUTH0_CLIENT_ID_NO_PROMPT,
    'custom': import.meta.env.VITE_AUTH0_CLIENT_ID,
  };
  return clientIds[flow] || clientIds['custom'];
};

export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: getClientIdForFlow(flow),
  audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  flow: flow,
};