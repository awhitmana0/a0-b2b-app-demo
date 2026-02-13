// Read flow from URL query parameter
const getFlowFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('flow') || 'custom'; // default to custom walkthrough
};

// Map flow names to client IDs
const getClientIdForFlow = (flow) => {
  const clientIds = {
    'credentials': import.meta.env.VITE_AUTH0_CLIENT_ID_PROMPT_CREDENTIALS,
    'organization': import.meta.env.VITE_AUTH0_CLIENT_ID_PROMPT_ORG,
    'no-prompt': import.meta.env.VITE_AUTH0_CLIENT_ID_NO_PROMPT,
    'custom': import.meta.env.VITE_AUTH0_CLIENT_ID,
  };
  return clientIds[flow] || clientIds['custom'];
};

const currentFlow = getFlowFromURL();

export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: getClientIdForFlow(currentFlow),
  audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  flow: currentFlow,
};